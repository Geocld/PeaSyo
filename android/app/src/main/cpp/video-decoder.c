// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#include "video-decoder.h"

#include <jni.h>

#include <media/NdkMediaCodec.h>
#include <media/NdkMediaFormat.h>
#include <android/native_window_jni.h>

#include <string.h>

#define INPUT_BUFFER_TIMEOUT_MS 10
#define REMOTE_INPUT_BUFFER_TIMEOUT_MS 50

static void *android_chiaki_video_decoder_output_thread_func(void *user);

ChiakiErrorCode android_chiaki_video_decoder_init(AndroidChiakiVideoDecoder *decoder, ChiakiLog *log, int32_t target_width, int32_t target_height, ChiakiCodec codec, bool remote)
{
    decoder->log = log;
    decoder->codec = NULL;
    decoder->timestamp_cur = 0;
    decoder->target_width = target_width;
    decoder->target_height = target_height;
    decoder->target_codec = codec;
    decoder->shutdown_output = false;

    decoder->stats.total_decode_time_ns = 0;
    decoder->stats.decoded_frames = 0;

    decoder->is_remote = remote;

    decoder->frames_lost = 0;

    return chiaki_mutex_init(&decoder->codec_mutex, false);
}

static void kill_decoder(AndroidChiakiVideoDecoder *decoder)
{
    chiaki_mutex_lock(&decoder->codec_mutex);
    decoder->shutdown_output = true;
    ssize_t codec_buf_index = AMediaCodec_dequeueInputBuffer(decoder->codec, 1000);
    if(codec_buf_index >= 0)
    {
        CHIAKI_LOGI(decoder->log, "Video Decoder sending EOS buffer");
        AMediaCodec_queueInputBuffer(decoder->codec, (size_t)codec_buf_index, 0, 0, decoder->timestamp_cur++, AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM);
        AMediaCodec_stop(decoder->codec);
        chiaki_mutex_unlock(&decoder->codec_mutex);
        chiaki_thread_join(&decoder->output_thread, NULL);
    }
    else
    {
        CHIAKI_LOGE(decoder->log, "Failed to get input buffer for shutting down Video Decoder!");
        AMediaCodec_stop(decoder->codec);
        chiaki_mutex_unlock(&decoder->codec_mutex);
    }
    AMediaCodec_delete(decoder->codec);
    decoder->codec = NULL;
    decoder->shutdown_output = false;
}

void android_chiaki_video_decoder_fini(AndroidChiakiVideoDecoder *decoder)
{
    if(decoder->codec)
        kill_decoder(decoder);
    chiaki_mutex_fini(&decoder->codec_mutex);
}

// 视频解码器输出 Surface
void android_chiaki_video_decoder_set_surface(AndroidChiakiVideoDecoder *decoder, JNIEnv *env, jobject surface, int32_t max_operating_rate)
{
    CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface");

	chiaki_mutex_lock(&decoder->codec_mutex);

    if(!surface)
    {
        CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface");
        if(decoder->codec)
        {
            kill_decoder(decoder);
            CHIAKI_LOGI(decoder->log, "StreamView Decoder shut down after surface was removed");
        } else {
            CHIAKI_LOGI(decoder->log, "StreamView decoder->codec is null");
        }
        return;
    }

    CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface22222");
    // 实时渲染视频
    if(decoder->codec)
    {
#if __ANDROID_API__ >= 23
        CHIAKI_LOGI(decoder->log, "StreamView Video decoder already initialized, swapping surface");
        ANativeWindow *new_window = surface ? ANativeWindow_fromSurface(env, surface) : NULL;
        AMediaCodec_setOutputSurface(decoder->codec, new_window);
        ANativeWindow_release(decoder->window);
        decoder->window = new_window;
#else
        CHIAKI_LOGE(decoder->log, "Video Decoder already initialized");
#endif
        goto beach;
    }

    // 获取原生窗口
    decoder->window = ANativeWindow_fromSurface(env, surface);

    // 选择编码格式
    const char *mime = chiaki_codec_is_h265(decoder->target_codec) ? "video/hevc" : "video/avc";
    CHIAKI_LOGI(decoder->log, "StreamView Initializing decoder with mime %s", mime);

    // 创建解码器
    decoder->codec = AMediaCodec_createDecoderByType(mime);
    if(!decoder->codec)
    {
        CHIAKI_LOGE(decoder->log, "StreamView Failed to create AMediaCodec for mime type %s", mime);
        goto error_surface;
    }

    // 配置解码器参数
    AMediaFormat *format = AMediaFormat_new();
    AMediaFormat_setString(format, AMEDIAFORMAT_KEY_MIME, mime);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_WIDTH, decoder->target_width);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_HEIGHT, decoder->target_height);

    // HDR settings
    AMediaFormat_setInt32(format, "color-standard", 0);
    AMediaFormat_setInt32(format, "color-transfer", 6);
    AMediaFormat_setInt32(format, "color-range", 2);

    int bufferSize = 2 * 1024 * 1024;
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_MAX_INPUT_SIZE, bufferSize);

    // 添加低延迟设置
#if __ANDROID_API__ >= 30
    // Android 11+ 官方低延迟选项
    AMediaFormat_setInt32(format, "low-latency", 1);
#endif

    // 设置高优先级和运行速率
#if __ANDROID_API__ >= 23
    // 使用字符串形式的键值，避免使用宏
    AMediaFormat_setInt32(format, "priority", 0);
    CHIAKI_LOGI(decoder->log, "maxOperatingRate %d", max_operating_rate);
    AMediaFormat_setInt32(format, "operating-rate", max_operating_rate);
#endif

    // MediaTek处理器
    AMediaFormat_setInt32(format, "vdec-lowlatency", 1);

    // 厂商特定低延迟选项 - 使用字符串形式
    // Qualcomm/高通处理器
    AMediaFormat_setInt32(format, "vendor.qti-ext-dec-picture-order.enable", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-dec-low-latency.enable", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-output-sw-fence-enable.value", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-output-fence.enable", 1);
    AMediaFormat_setInt32(format, "vendor.qti-ext-output-fence.fence_type", 1);

    // Exynos处理器
    AMediaFormat_setInt32(format, "vendor.rtc-ext-dec-low-latency.enable", 1);

    // Amlogic处理器
    AMediaFormat_setInt32(format, "vendor.low-latency.enable", 1);

    // Kirin处理器
    AMediaFormat_setInt32(format, "vendor.hisi-ext-low-latency-video-dec.video-scene-for-low-latency-req", 1);
    AMediaFormat_setInt32(format, "vendor.hisi-ext-low-latency-video-dec.video-scene-for-low-latency-rdy", -1);

    media_status_t r = AMediaCodec_configure(decoder->codec, format, decoder->window, NULL, 0);
    if(r != AMEDIA_OK)
    {
        CHIAKI_LOGE(decoder->log, "AMediaCodec_configure() failed: %d", (int)r);
        AMediaFormat_delete(format);
        goto error_codec;
    }

    // 启动解码器
    r = AMediaCodec_start(decoder->codec);
    AMediaFormat_delete(format);
    if(r != AMEDIA_OK)
    {
        CHIAKI_LOGE(decoder->log, "AMediaCodec_start() failed: %d", (int)r);
        goto error_codec;
    }

    // 创建输出线程
    ChiakiErrorCode err = chiaki_thread_create(&decoder->output_thread, android_chiaki_video_decoder_output_thread_func, decoder);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(decoder->log, "Failed to create output thread for AMediaCodec");
        goto error_codec;
    }

    goto beach;

    error_codec:
    AMediaCodec_delete(decoder->codec);
    decoder->codec = NULL;

    error_surface:
    ANativeWindow_release(decoder->window);
    decoder->window = NULL;

    beach:
    chiaki_mutex_unlock(&decoder->codec_mutex);
}

// receive video buffer
bool android_chiaki_video_decoder_video_sample(uint8_t *buf, size_t buf_size, int32_t frames_lost, bool frame_recovered, void *user)
{
    bool r = true;
    AndroidChiakiVideoDecoder *decoder = user;
    chiaki_mutex_lock(&decoder->codec_mutex);

    decoder->frames_lost = frames_lost;

    if(!decoder->codec)
    {
        CHIAKI_LOGE(decoder->log, "Received video data, but decoder is not initialized!");
        goto beach; // unlock process
    }

    clock_gettime(CLOCK_MONOTONIC, &decoder->stats.decode_start);

    while(buf_size > 0)
    {
        // send video stream to MediaCodec
        int timeout_ms = decoder->is_remote ? REMOTE_INPUT_BUFFER_TIMEOUT_MS : INPUT_BUFFER_TIMEOUT_MS;
        ssize_t codec_buf_index = AMediaCodec_dequeueInputBuffer(decoder->codec, timeout_ms * 1000);
        if(codec_buf_index < 0)
        {
            CHIAKI_LOGE(decoder->log, "Failed to get input buffer");
            r = false;
            goto beach;
        }

        size_t codec_buf_size;
        uint8_t *codec_buf = AMediaCodec_getInputBuffer(decoder->codec, (size_t)codec_buf_index, &codec_buf_size);
        size_t codec_sample_size = buf_size;
        if(codec_sample_size > codec_buf_size)
        {
            //CHIAKI_LOGD(decoder->log, "Sample is bigger than buffer, splitting");
            codec_sample_size = codec_buf_size;
        }
        memcpy(codec_buf, buf, codec_sample_size);
        media_status_t r = AMediaCodec_queueInputBuffer(decoder->codec, (size_t)codec_buf_index, 0, codec_sample_size, decoder->timestamp_cur++, 0); // timestamp just raised by 1 for maximum realtime
        if(r != AMEDIA_OK)
        {
            CHIAKI_LOGE(decoder->log, "AMediaCodec_queueInputBuffer() failed: %d", (int)r);
        }
        buf += codec_sample_size;
        buf_size -= codec_sample_size;

    }

    beach:
    chiaki_mutex_unlock(&decoder->codec_mutex);
    return r;
}

static void *android_chiaki_video_decoder_output_thread_func(void *user)
{
    AndroidChiakiVideoDecoder *decoder = user;

    while(1)
    {
        AMediaCodecBufferInfo info;
        ssize_t status = AMediaCodec_dequeueOutputBuffer(decoder->codec, &info, -1);
        if(status >= 0)
        {
            // 计算本帧解码时间
            struct timespec decode_end;
            clock_gettime(CLOCK_MONOTONIC, &decode_end);

            uint64_t frame_decode_time =
                    (decode_end.tv_sec - decoder->stats.decode_start.tv_sec) * 1000000000LL +
                    (decode_end.tv_nsec - decoder->stats.decode_start.tv_nsec);

            // 更新统计信息
            chiaki_mutex_lock(&decoder->codec_mutex);
            decoder->stats.total_decode_time_ns += frame_decode_time;
            decoder->stats.decoded_frames++;

            // 计算并输出平均解码时间
            if(decoder->stats.decoded_frames % 60 == 0) // 每60帧输出一次统计
            {
                double avg_decode_time_ms =
                        (double)decoder->stats.total_decode_time_ns /
                        (double)decoder->stats.decoded_frames / 1000000.0;

                // 平均解码时间
//                CHIAKI_LOGI(decoder->log, "Average decode time: %.2f ms", avg_decode_time_ms);
                decoder->avg_decode_time = avg_decode_time_ms;
            }
            chiaki_mutex_unlock(&decoder->codec_mutex);

            AMediaCodec_releaseOutputBuffer(decoder->codec, (size_t)status, info.size != 0);
            if(info.flags & AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM)
            {
                CHIAKI_LOGI(decoder->log, "AMediaCodec reported EOS");
                break;
            }
        }
        else
        {
            chiaki_mutex_lock(&decoder->codec_mutex);
            bool shutdown = decoder->shutdown_output;
            chiaki_mutex_unlock(&decoder->codec_mutex);
            if(shutdown)
            {
                CHIAKI_LOGI(decoder->log, "Video Decoder Output Thread detected shutdown after reported error");
                break;
            }
        }
    }

    CHIAKI_LOGI(decoder->log, "Video Decoder Output Thread exiting");

    // 本次串流平均解码时间
    double final_avg_decode_time_ms =
            (double)decoder->stats.total_decode_time_ns /
            (double)decoder->stats.decoded_frames / 1000000.0;
    CHIAKI_LOGI(decoder->log, "Final average decode time: %.2f ms (%u frames)",
                final_avg_decode_time_ms, decoder->stats.decoded_frames);

    return NULL;
}