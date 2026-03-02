// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#include "video-decoder.h"

#include <jni.h>

#include <android/choreographer.h>
#include <android/looper.h>
#include <android/native_window_jni.h>
#include <media/NdkMediaCodec.h>
#include <media/NdkMediaFormat.h>

#include <string.h>
#include <time.h>

#define INPUT_BUFFER_TIMEOUT_MS 10
#define REMOTE_INPUT_BUFFER_TIMEOUT_MS 50
#define OUTPUT_BUFFER_TIMEOUT_US 50000
#define OUTPUT_BUFFER_QUEUE_LIMIT 2

#define FRAME_PACING_MIN_LATENCY 0
#define FRAME_PACING_BALANCED 1
#define FRAME_PACING_CAP_FPS 2
#define FRAME_PACING_MAX_SMOOTHNESS 3

#define DEFAULT_STREAM_FPS 60

static void *android_chiaki_video_decoder_output_thread_func(void *user);
static void *android_chiaki_video_decoder_choreographer_thread_func(void *user);
static void android_chiaki_video_decoder_choreographer_frame_cb(long frame_time_nanos, void *data);

static uint64_t monotonic_time_ns(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + (uint64_t)ts.tv_nsec;
}

static uint32_t sanitize_stream_fps(uint32_t fps)
{
    if(fps == 0 || fps > 240)
        return DEFAULT_STREAM_FPS;
    return fps;
}

static uint64_t frame_interval_from_fps(uint32_t fps)
{
    uint32_t sanitized_fps = sanitize_stream_fps(fps);
    return 1000000000ULL / (uint64_t)sanitized_fps;
}

static int32_t sanitize_frame_pacing(int32_t frame_pacing)
{
    if(frame_pacing < FRAME_PACING_MIN_LATENCY || frame_pacing > FRAME_PACING_MAX_SMOOTHNESS)
        return FRAME_PACING_MIN_LATENCY;
    return frame_pacing;
}

static const char *frame_pacing_to_string(int32_t frame_pacing)
{
    switch(frame_pacing)
    {
        case FRAME_PACING_MIN_LATENCY:
            return "MIN_LATENCY";
        case FRAME_PACING_BALANCED:
            return "BALANCED";
        case FRAME_PACING_CAP_FPS:
            return "CAP_FPS";
        case FRAME_PACING_MAX_SMOOTHNESS:
            return "MAX_SMOOTHNESS";
        default:
            return "UNKNOWN";
    }
}

static void clear_output_queue_locked(AndroidChiakiVideoDecoder *decoder)
{
    while(decoder->output_buffer_queue_size > 0)
    {
        size_t index = decoder->output_buffer_queue[0];
        for(size_t i = 1; i < decoder->output_buffer_queue_size; i++)
            decoder->output_buffer_queue[i - 1] = decoder->output_buffer_queue[i];
        decoder->output_buffer_queue_size--;
        if(decoder->codec)
            AMediaCodec_releaseOutputBuffer(decoder->codec, index, false);
    }
}

static void clear_output_queue(AndroidChiakiVideoDecoder *decoder)
{
    chiaki_mutex_lock(&decoder->codec_mutex);
    clear_output_queue_locked(decoder);
    chiaki_mutex_unlock(&decoder->codec_mutex);
}

static void push_output_queue_locked(AndroidChiakiVideoDecoder *decoder, size_t index)
{
    if(decoder->output_buffer_queue_size == OUTPUT_BUFFER_QUEUE_LIMIT)
    {
        size_t oldest_index = decoder->output_buffer_queue[0];
        decoder->output_buffer_queue[0] = decoder->output_buffer_queue[1];
        decoder->output_buffer_queue_size = 1;
        if(decoder->codec)
            AMediaCodec_releaseOutputBuffer(decoder->codec, oldest_index, false);
    }
    decoder->output_buffer_queue[decoder->output_buffer_queue_size++] = index;
}

static bool pop_output_queue_locked(AndroidChiakiVideoDecoder *decoder, size_t *index)
{
    if(decoder->output_buffer_queue_size == 0)
        return false;
    *index = decoder->output_buffer_queue[0];
    for(size_t i = 1; i < decoder->output_buffer_queue_size; i++)
        decoder->output_buffer_queue[i - 1] = decoder->output_buffer_queue[i];
    decoder->output_buffer_queue_size--;
    return true;
}

static void release_output_buffer(AndroidChiakiVideoDecoder *decoder, size_t index, bool render, int32_t frame_pacing, int64_t release_time_ns)
{
    media_status_t res;
    if(!render)
    {
        AMediaCodec_releaseOutputBuffer(decoder->codec, index, false);
        return;
    }

#if __ANDROID_API__ >= 21
    if(frame_pacing == FRAME_PACING_MIN_LATENCY)
    {
        int64_t now_ns = (int64_t)monotonic_time_ns();
        res = AMediaCodec_releaseOutputBufferAtTime(decoder->codec, index, now_ns);
    }
    else if(frame_pacing == FRAME_PACING_BALANCED)
    {
        int64_t target_ns = release_time_ns > 0 ? release_time_ns : (int64_t)monotonic_time_ns();
        res = AMediaCodec_releaseOutputBufferAtTime(decoder->codec, index, target_ns);
    }
    else if(frame_pacing == FRAME_PACING_CAP_FPS)
    {
        // Moonlight renderer behavior: CAP_FPS uses the same release policy as MAX_SMOOTHNESS.
        // The FPS cap itself is handled outside the decoder path (display mode / refresh policy).
        res = AMediaCodec_releaseOutputBufferAtTime(decoder->codec, index, 0);
    }
    else if(frame_pacing == FRAME_PACING_MAX_SMOOTHNESS)
    {
        // Never ask SurfaceFlinger to drop this frame.
        res = AMediaCodec_releaseOutputBufferAtTime(decoder->codec, index, 0);
    }
    else
    {
        int64_t now_ns = (int64_t)monotonic_time_ns();
        res = AMediaCodec_releaseOutputBufferAtTime(decoder->codec, index, now_ns);
    }
    if(res == AMEDIA_OK)
        return;
#endif

    AMediaCodec_releaseOutputBuffer(decoder->codec, index, true);
}

static void drop_pending_output_buffers(AndroidChiakiVideoDecoder *decoder)
{
    clear_output_queue(decoder);

    while(true)
    {
        AMediaCodecBufferInfo info;
        ssize_t out_index = AMediaCodec_dequeueOutputBuffer(decoder->codec, &info, 0);
        if(out_index >= 0)
        {
            AMediaCodec_releaseOutputBuffer(decoder->codec, (size_t)out_index, false);
            continue;
        }
        if(out_index == AMEDIACODEC_INFO_OUTPUT_FORMAT_CHANGED ||
           out_index == AMEDIACODEC_INFO_OUTPUT_BUFFERS_CHANGED)
        {
            continue;
        }
        break;
    }
}

static void maybe_render_balanced_frame(AndroidChiakiVideoDecoder *decoder, uint64_t frame_interval_ns)
{
    bool should_render = false;
    size_t output_index;
    uint64_t render_time_ns = 0;

    chiaki_mutex_lock(&decoder->codec_mutex);
    if(decoder->output_buffer_queue_size > 0)
    {
        uint64_t now_ns = monotonic_time_ns();
        if(decoder->last_render_time_ns == 0 || now_ns - decoder->last_render_time_ns >= frame_interval_ns)
        {
            if(pop_output_queue_locked(decoder, &output_index))
            {
                render_time_ns = now_ns;
                if(decoder->last_render_time_ns != 0)
                {
                    uint64_t candidate = decoder->last_render_time_ns + frame_interval_ns;
                    if(candidate > render_time_ns)
                        render_time_ns = candidate;
                }
                decoder->last_render_time_ns = render_time_ns;
                should_render = true;
            }
        }
    }
    chiaki_mutex_unlock(&decoder->codec_mutex);

    if(should_render)
        release_output_buffer(decoder, output_index, true, FRAME_PACING_BALANCED, (int64_t)render_time_ns);
}

static void request_choreographer_callback(AndroidChiakiVideoDecoder *decoder)
{
#if __ANDROID_API__ >= 24
    decoder->choreographer_request_post = true;
    if(decoder->choreographer_looper)
        ALooper_wake(decoder->choreographer_looper);
#endif
}

static void start_choreographer_thread_if_needed(AndroidChiakiVideoDecoder *decoder)
{
#if __ANDROID_API__ >= 24
    if(decoder->choreographer_thread_started)
        return;

    decoder->shutdown_choreographer = false;
    ChiakiErrorCode thread_res = chiaki_thread_create(
        &decoder->choreographer_thread,
        android_chiaki_video_decoder_choreographer_thread_func,
        decoder);
    if(thread_res != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(decoder->log, "Failed to create choreographer thread");
        return;
    }
    decoder->choreographer_thread_started = true;
#endif
}

static void android_chiaki_video_decoder_choreographer_frame_cb(long frame_time_nanos, void *data)
{
#if __ANDROID_API__ >= 24
    AndroidChiakiVideoDecoder *decoder = data;
    bool keep_running = false;
    bool should_render = false;
    size_t output_index = 0;
    int64_t render_time_ns = (int64_t)frame_time_nanos;

    chiaki_mutex_lock(&decoder->codec_mutex);
    if(!decoder->shutdown_choreographer &&
       decoder->frame_pacing == FRAME_PACING_BALANCED &&
       decoder->codec)
    {
        keep_running = true;
        uint64_t frame_time_u64 = frame_time_nanos > 0 ? (uint64_t)frame_time_nanos : monotonic_time_ns();
        if(pop_output_queue_locked(decoder, &output_index))
        {
            decoder->last_render_time_ns = frame_time_u64;
            render_time_ns = (int64_t)frame_time_u64;
            should_render = true;
        }
    }
    chiaki_mutex_unlock(&decoder->codec_mutex);

    if(should_render)
        release_output_buffer(decoder, output_index, true, FRAME_PACING_BALANCED, render_time_ns);

    if(keep_running)
    {
        AChoreographer *choreographer = AChoreographer_getInstance();
        AChoreographer_postFrameCallback(choreographer, android_chiaki_video_decoder_choreographer_frame_cb, decoder);
    }
#else
    (void)frame_time_nanos;
    (void)data;
#endif
}

static void *android_chiaki_video_decoder_choreographer_thread_func(void *user)
{
#if __ANDROID_API__ >= 24
    AndroidChiakiVideoDecoder *decoder = user;
    ALooper_prepare(ALOOPER_PREPARE_ALLOW_NON_CALLBACKS);
    ALooper *looper = ALooper_forThread();

    chiaki_mutex_lock(&decoder->codec_mutex);
    decoder->choreographer_looper = looper;
    chiaki_mutex_unlock(&decoder->codec_mutex);

    while(true)
    {
        bool shutdown = false;
        bool should_post = false;

        chiaki_mutex_lock(&decoder->codec_mutex);
        shutdown = decoder->shutdown_choreographer;
        if(!shutdown &&
           decoder->choreographer_request_post &&
           decoder->frame_pacing == FRAME_PACING_BALANCED &&
           decoder->codec)
        {
            decoder->choreographer_request_post = false;
            should_post = true;
        }
        chiaki_mutex_unlock(&decoder->codec_mutex);

        if(shutdown)
            break;

        if(should_post)
        {
            AChoreographer *choreographer = AChoreographer_getInstance();
            AChoreographer_postFrameCallback(choreographer, android_chiaki_video_decoder_choreographer_frame_cb, decoder);
        }

        ALooper_pollOnce(16, NULL, NULL, NULL);
    }

    chiaki_mutex_lock(&decoder->codec_mutex);
    decoder->choreographer_looper = NULL;
    chiaki_mutex_unlock(&decoder->codec_mutex);
#else
    (void)user;
#endif
    return NULL;
}

ChiakiErrorCode android_chiaki_video_decoder_init(AndroidChiakiVideoDecoder *decoder, ChiakiLog *log, int32_t target_width, int32_t target_height, ChiakiCodec codec, bool remote, uint32_t stream_fps)
{
    decoder->log = log;
    decoder->codec = NULL;
    decoder->window = NULL;
    decoder->timestamp_cur = 0;
    decoder->target_width = target_width;
    decoder->target_height = target_height;
    decoder->target_codec = codec;
    decoder->shutdown_output = false;
    decoder->output_thread_started = false;
    decoder->shutdown_choreographer = false;
    decoder->choreographer_thread_started = false;
    decoder->choreographer_request_post = false;
    decoder->choreographer_looper = NULL;

    decoder->stream_fps = sanitize_stream_fps(stream_fps);
    decoder->frame_pacing = FRAME_PACING_MIN_LATENCY;
    decoder->frame_interval_ns = frame_interval_from_fps(decoder->stream_fps);
    decoder->last_render_time_ns = 0;
    decoder->output_buffer_queue_size = 0;
    decoder->drop_pending_output = false;

    decoder->stats.total_decode_time_ns = 0;
    decoder->stats.decoded_frames = 0;

    decoder->is_remote = remote;
    decoder->frames_lost = 0;

    return chiaki_mutex_init(&decoder->codec_mutex, false);
}

static void kill_decoder(AndroidChiakiVideoDecoder *decoder)
{
    bool join_output_thread = false;
    bool join_choreographer_thread = false;
    ALooper *choreographer_looper = NULL;

    chiaki_mutex_lock(&decoder->codec_mutex);

    if(!decoder->codec)
    {
        decoder->shutdown_output = true;
        decoder->shutdown_choreographer = true;
        join_output_thread = decoder->output_thread_started;
        join_choreographer_thread = decoder->choreographer_thread_started;
        choreographer_looper = decoder->choreographer_looper;
        decoder->output_thread_started = false;
        decoder->choreographer_thread_started = false;
        if(decoder->window)
        {
            ANativeWindow_release(decoder->window);
            decoder->window = NULL;
        }
        chiaki_mutex_unlock(&decoder->codec_mutex);

        if(choreographer_looper)
            ALooper_wake(choreographer_looper);
        if(join_choreographer_thread)
            chiaki_thread_join(&decoder->choreographer_thread, NULL);
        if(join_output_thread)
            chiaki_thread_join(&decoder->output_thread, NULL);

        chiaki_mutex_lock(&decoder->codec_mutex);
        decoder->shutdown_output = false;
        decoder->shutdown_choreographer = false;
        decoder->choreographer_looper = NULL;
        decoder->choreographer_request_post = false;
        decoder->drop_pending_output = false;
        decoder->output_buffer_queue_size = 0;
        decoder->last_render_time_ns = 0;
        chiaki_mutex_unlock(&decoder->codec_mutex);
        return;
    }

    decoder->shutdown_output = true;
    decoder->shutdown_choreographer = true;
    decoder->choreographer_request_post = false;
    decoder->drop_pending_output = true;

    join_output_thread = decoder->output_thread_started;
    join_choreographer_thread = decoder->choreographer_thread_started;
    choreographer_looper = decoder->choreographer_looper;
    decoder->output_thread_started = false;
    decoder->choreographer_thread_started = false;
    chiaki_mutex_unlock(&decoder->codec_mutex);

    if(choreographer_looper)
        ALooper_wake(choreographer_looper);

    if(join_choreographer_thread)
        chiaki_thread_join(&decoder->choreographer_thread, NULL);

    if(join_output_thread)
        chiaki_thread_join(&decoder->output_thread, NULL);

    chiaki_mutex_lock(&decoder->codec_mutex);
    clear_output_queue_locked(decoder);
    AMediaCodec_stop(decoder->codec);
    AMediaCodec_delete(decoder->codec);
    decoder->codec = NULL;
    if(decoder->window)
    {
        ANativeWindow_release(decoder->window);
        decoder->window = NULL;
    }
    decoder->shutdown_output = false;
    decoder->shutdown_choreographer = false;
    decoder->choreographer_request_post = false;
    decoder->drop_pending_output = false;
    decoder->output_buffer_queue_size = 0;
    decoder->last_render_time_ns = 0;
    decoder->choreographer_looper = NULL;
    chiaki_mutex_unlock(&decoder->codec_mutex);
}

void android_chiaki_video_decoder_fini(AndroidChiakiVideoDecoder *decoder)
{
    if(decoder->codec || decoder->window || decoder->output_thread_started || decoder->choreographer_thread_started)
        kill_decoder(decoder);
    chiaki_mutex_fini(&decoder->codec_mutex);
}

void android_chiaki_video_decoder_set_surface(AndroidChiakiVideoDecoder *decoder, JNIEnv *env, jobject surface, int32_t max_operating_rate, int32_t frame_pacing)
{
    CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface000");

    int32_t sanitized_frame_pacing = sanitize_frame_pacing(frame_pacing);
    CHIAKI_LOGI(decoder->log, "Video decoder set surface, maxOperatingRate=%d framePacing=%d(%s)",
                max_operating_rate, sanitized_frame_pacing, frame_pacing_to_string(sanitized_frame_pacing));

    if(!surface)
    {
        CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface");
        if(decoder->codec || decoder->window || decoder->output_thread_started || decoder->choreographer_thread_started)
        {
            kill_decoder(decoder);
            CHIAKI_LOGI(decoder->log, "Video decoder shut down after surface was removed");
        }
        return;
    }

    CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface22222");

    chiaki_mutex_lock(&decoder->codec_mutex);

    decoder->frame_pacing = sanitized_frame_pacing;
    decoder->frame_interval_ns = frame_interval_from_fps(decoder->stream_fps);
    decoder->last_render_time_ns = 0;
    decoder->drop_pending_output = true;

    CHIAKI_LOGI(decoder->log, "StreamView decoder_frame_pacing: %d", decoder->frame_pacing);

    if(sanitized_frame_pacing == FRAME_PACING_BALANCED)
        request_choreographer_callback(decoder);
    else
        decoder->choreographer_request_post = false;

    if(decoder->codec)
    {
#if __ANDROID_API__ >= 23
        ANativeWindow *new_window = ANativeWindow_fromSurface(env, surface);
        AMediaCodec_setOutputSurface(decoder->codec, new_window);
        ANativeWindow_release(decoder->window);
        decoder->window = new_window;
#else
        CHIAKI_LOGE(decoder->log, "Video Decoder already initialized");
#endif
        chiaki_mutex_unlock(&decoder->codec_mutex);
        return;
    }

    decoder->window = ANativeWindow_fromSurface(env, surface);
    const char *mime = chiaki_codec_is_h265(decoder->target_codec) ? "video/hevc" : "video/avc";

    decoder->codec = AMediaCodec_createDecoderByType(mime);
    if(!decoder->codec)
    {
        CHIAKI_LOGE(decoder->log, "Failed to create AMediaCodec for mime type %s", mime);
        goto error_surface;
    }

    AMediaFormat *format = AMediaFormat_new();
    AMediaFormat_setString(format, AMEDIAFORMAT_KEY_MIME, mime);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_WIDTH, decoder->target_width);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_HEIGHT, decoder->target_height);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_MAX_INPUT_SIZE, 2 * 1024 * 1024);

    // HDR settings
    AMediaFormat_setInt32(format, "color-standard", 0);
    AMediaFormat_setInt32(format, "color-transfer", 6);
    AMediaFormat_setInt32(format, "color-range", 2);

#if __ANDROID_API__ >= 30
    AMediaFormat_setInt32(format, "low-latency", 1);
#endif

#if __ANDROID_API__ >= 23
    AMediaFormat_setInt32(format, "priority", 0);
    AMediaFormat_setInt32(format, "operating-rate", max_operating_rate);
#endif

    // Prefer frame dropping for min-latency mode, and prefer retention for smoothness modes.
    AMediaFormat_setInt32(format, "allow-frame-drop", sanitized_frame_pacing == FRAME_PACING_MIN_LATENCY ? 1 : 0);

    // Vendor low-latency hints
    AMediaFormat_setInt32(format, "vdec-lowlatency", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-dec-picture-order.enable", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-dec-low-latency.enable", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-output-sw-fence-enable.value", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-output-fence.enable", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-output-fence.fence_type", 1);
    AMediaFormat_setInt32(format, "vendor.rtc-ext-dec-low-latency.enable", 1);
    AMediaFormat_setInt32(format, "vendor.low-latency.enable", 1);
    AMediaFormat_setInt32(format, "vendor.hisi-ext-low-latency-video-dec.video-scene-for-low-latency-req", 1);
    AMediaFormat_setInt32(format, "vendor.hisi-ext-low-latency-video-dec.video-scene-for-low-latency-rdy", -1);

    media_status_t configure_res = AMediaCodec_configure(decoder->codec, format, decoder->window, NULL, 0);
    AMediaFormat_delete(format);
    if(configure_res != AMEDIA_OK)
    {
        CHIAKI_LOGE(decoder->log, "AMediaCodec_configure() failed: %d", (int)configure_res);
        goto error_codec;
    }

    media_status_t start_res = AMediaCodec_start(decoder->codec);
    if(start_res != AMEDIA_OK)
    {
        CHIAKI_LOGE(decoder->log, "AMediaCodec_start() failed: %d", (int)start_res);
        goto error_codec;
    }

    ChiakiErrorCode thread_res = chiaki_thread_create(&decoder->output_thread, android_chiaki_video_decoder_output_thread_func, decoder);
    if(thread_res != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(decoder->log, "Failed to create output thread for AMediaCodec");
        goto error_codec;
    }

    decoder->output_thread_started = true;

    start_choreographer_thread_if_needed(decoder);
    if(sanitized_frame_pacing == FRAME_PACING_BALANCED)
        request_choreographer_callback(decoder);

    chiaki_mutex_unlock(&decoder->codec_mutex);
    return;

error_codec:
    AMediaCodec_delete(decoder->codec);
    decoder->codec = NULL;
error_surface:
    if(decoder->window)
    {
        ANativeWindow_release(decoder->window);
        decoder->window = NULL;
    }
    chiaki_mutex_unlock(&decoder->codec_mutex);
}

bool android_chiaki_video_decoder_video_sample(uint8_t *buf, size_t buf_size, int32_t frames_lost, bool frame_recovered, void *user)
{
    bool success = true;
    AndroidChiakiVideoDecoder *decoder = user;
    chiaki_mutex_lock(&decoder->codec_mutex);

    decoder->frames_lost = frames_lost;
    if(frames_lost > 0 && !frame_recovered)
        decoder->drop_pending_output = true;

    if(!decoder->codec)
    {
        CHIAKI_LOGE(decoder->log, "Received video data, but decoder is not initialized");
        success = false;
        goto beach;
    }

    clock_gettime(CLOCK_MONOTONIC, &decoder->stats.decode_start);

    while(buf_size > 0)
    {
        int timeout_ms = decoder->is_remote ? REMOTE_INPUT_BUFFER_TIMEOUT_MS : INPUT_BUFFER_TIMEOUT_MS;
        ssize_t codec_buf_index = AMediaCodec_dequeueInputBuffer(decoder->codec, timeout_ms * 1000);
        if(codec_buf_index < 0)
        {
            CHIAKI_LOGE(decoder->log, "Failed to get input buffer");
            success = false;
            goto beach;
        }

        size_t codec_buf_size;
        uint8_t *codec_buf = AMediaCodec_getInputBuffer(decoder->codec, (size_t)codec_buf_index, &codec_buf_size);
        size_t codec_sample_size = buf_size > codec_buf_size ? codec_buf_size : buf_size;
        memcpy(codec_buf, buf, codec_sample_size);

        media_status_t queue_res = AMediaCodec_queueInputBuffer(decoder->codec, (size_t)codec_buf_index, 0, codec_sample_size, decoder->timestamp_cur++, 0);
        if(queue_res != AMEDIA_OK)
        {
            CHIAKI_LOGE(decoder->log, "AMediaCodec_queueInputBuffer() failed: %d", (int)queue_res);
            success = false;
            goto beach;
        }

        buf += codec_sample_size;
        buf_size -= codec_sample_size;
    }

beach:
    chiaki_mutex_unlock(&decoder->codec_mutex);
    return success;
}

static void *android_chiaki_video_decoder_output_thread_func(void *user)
{
    AndroidChiakiVideoDecoder *decoder = user;

    while(true)
    {
        bool shutdown = false;
        bool should_drop_pending_output = false;
        bool use_choreographer_for_balanced = false;
        int32_t frame_pacing = FRAME_PACING_MIN_LATENCY;
        uint64_t frame_interval_ns = frame_interval_from_fps(DEFAULT_STREAM_FPS);

        chiaki_mutex_lock(&decoder->codec_mutex);
        shutdown = decoder->shutdown_output;
        should_drop_pending_output = decoder->drop_pending_output;
        decoder->drop_pending_output = false;
        frame_pacing = decoder->frame_pacing;
        frame_interval_ns = decoder->frame_interval_ns;
        use_choreographer_for_balanced = decoder->choreographer_thread_started;
        chiaki_mutex_unlock(&decoder->codec_mutex);

        if(shutdown)
            break;

        if(should_drop_pending_output)
            drop_pending_output_buffers(decoder);

        AMediaCodecBufferInfo info;
        ssize_t out_index = AMediaCodec_dequeueOutputBuffer(decoder->codec, &info, OUTPUT_BUFFER_TIMEOUT_US);

        if(out_index >= 0)
        {
            struct timespec decode_end;
            clock_gettime(CLOCK_MONOTONIC, &decode_end);

            uint64_t frame_decode_time = (uint64_t)(decode_end.tv_sec - decoder->stats.decode_start.tv_sec) * 1000000000ULL +
                                         (uint64_t)(decode_end.tv_nsec - decoder->stats.decode_start.tv_nsec);

            chiaki_mutex_lock(&decoder->codec_mutex);
            decoder->stats.total_decode_time_ns += frame_decode_time;
            decoder->stats.decoded_frames++;
            if(decoder->stats.decoded_frames % 60 == 0)
            {
                decoder->avg_decode_time =
                    (double)decoder->stats.total_decode_time_ns / (double)decoder->stats.decoded_frames / 1000000.0;
            }
            chiaki_mutex_unlock(&decoder->codec_mutex);

            bool reached_eos = (info.flags & AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM) != 0;

            if(frame_pacing == FRAME_PACING_BALANCED)
            {
                if(info.size != 0)
                {
                    chiaki_mutex_lock(&decoder->codec_mutex);
                    push_output_queue_locked(decoder, (size_t)out_index);
                    chiaki_mutex_unlock(&decoder->codec_mutex);
                }
                else
                    AMediaCodec_releaseOutputBuffer(decoder->codec, (size_t)out_index, false);

                if(!use_choreographer_for_balanced)
                    maybe_render_balanced_frame(decoder, frame_interval_ns);
            }
            else
            {
                size_t last_index = (size_t)out_index;
                AMediaCodecBufferInfo latest_info = info;

                while(true)
                {
                    AMediaCodecBufferInfo drain_info;
                    ssize_t drain_index = AMediaCodec_dequeueOutputBuffer(decoder->codec, &drain_info, 0);
                    if(drain_index >= 0)
                    {
                        AMediaCodec_releaseOutputBuffer(decoder->codec, last_index, false);
                        last_index = (size_t)drain_index;
                        latest_info = drain_info;
                        if(drain_info.flags & AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM)
                            reached_eos = true;
                        continue;
                    }
                    if(drain_index == AMEDIACODEC_INFO_OUTPUT_FORMAT_CHANGED ||
                       drain_index == AMEDIACODEC_INFO_OUTPUT_BUFFERS_CHANGED)
                    {
                        continue;
                    }
                    break;
                }

                release_output_buffer(decoder, last_index, latest_info.size != 0, frame_pacing, 0);
            }

            if(reached_eos)
            {
                CHIAKI_LOGI(decoder->log, "AMediaCodec reported EOS");
                break;
            }
        }
        else
        {
            if(out_index == AMEDIACODEC_INFO_OUTPUT_FORMAT_CHANGED ||
               out_index == AMEDIACODEC_INFO_OUTPUT_BUFFERS_CHANGED ||
               out_index == AMEDIACODEC_INFO_TRY_AGAIN_LATER)
            {
                if(frame_pacing == FRAME_PACING_BALANCED && !use_choreographer_for_balanced)
                    maybe_render_balanced_frame(decoder, frame_interval_ns);
                continue;
            }

            chiaki_mutex_lock(&decoder->codec_mutex);
            shutdown = decoder->shutdown_output;
            chiaki_mutex_unlock(&decoder->codec_mutex);
            if(shutdown)
                break;
        }
    }

    clear_output_queue(decoder);
    CHIAKI_LOGI(decoder->log, "Video Decoder Output Thread exiting");

    chiaki_mutex_lock(&decoder->codec_mutex);
    if(decoder->stats.decoded_frames > 0)
    {
        double final_avg_decode_time_ms =
            (double)decoder->stats.total_decode_time_ns / (double)decoder->stats.decoded_frames / 1000000.0;
        CHIAKI_LOGI(decoder->log, "Final average decode time: %.2f ms (%u frames)", final_avg_decode_time_ms, decoder->stats.decoded_frames);
    }
    else
    {
        CHIAKI_LOGI(decoder->log, "Final average decode time: n/a (0 frames)");
    }
    chiaki_mutex_unlock(&decoder->codec_mutex);

    return NULL;
}
