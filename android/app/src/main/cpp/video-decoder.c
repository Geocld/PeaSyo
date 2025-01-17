// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#include "video-decoder.h"

#include <jni.h>

#include <media/NdkMediaCodec.h>
#include <media/NdkMediaFormat.h>
#include <android/native_window_jni.h>

#include <string.h>

#define INPUT_BUFFER_TIMEOUT_MS 10

static void *android_chiaki_video_decoder_output_thread_func(void *user);

ChiakiErrorCode android_chiaki_video_decoder_init(AndroidChiakiVideoDecoder *decoder, ChiakiLog *log, int32_t target_width, int32_t target_height, ChiakiCodec codec)
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

    // FPS count
    clock_gettime(CLOCK_MONOTONIC, &decoder->fps_stats.fps_start_time);
    decoder->fps_stats.fps_frame_count = 0;
    decoder->fps_stats.current_fps = 0.0f;
    decoder->fps_stats.fps_update_interval = 60;

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
void android_chiaki_video_decoder_set_surface(AndroidChiakiVideoDecoder *decoder, JNIEnv *env, jobject surface)
{
    CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface");

    // 这里不能锁进程，否则会导致RN ui渲染进程卡住
	chiaki_mutex_lock(&decoder->codec_mutex);

	if(!surface)
	{
        CHIAKI_LOGI(decoder->log, "StreamView android_chiaki_video_decoder_set_surface111111");
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

	// Get native window
	decoder->window = ANativeWindow_fromSurface(env, surface);

	// Codec
	const char *mime = chiaki_codec_is_h265(decoder->target_codec) ? "video/hevc" : "video/avc";
	CHIAKI_LOGI(decoder->log, "StreamView Initializing decoder with mime %s", mime);

	// Set Codec
	decoder->codec = AMediaCodec_createDecoderByType(mime);
	if(!decoder->codec)
	{
		CHIAKI_LOGE(decoder->log, "StreamView Failed to create AMediaCodec for mime type %s", mime);
		goto error_surface;
	}

 	// Config codec
	AMediaFormat *format = AMediaFormat_new();
	AMediaFormat_setString(format, AMEDIAFORMAT_KEY_MIME, mime);
	AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_WIDTH, decoder->target_width);
	AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_HEIGHT, decoder->target_height);
    AMediaFormat_setInt32(format, "low-latency", 1);

	media_status_t r = AMediaCodec_configure(decoder->codec, format, decoder->window, NULL, 0);
	if(r != AMEDIA_OK)
	{
		CHIAKI_LOGE(decoder->log, "AMediaCodec_configure() failed: %d", (int)r);
		AMediaFormat_delete(format);
		goto error_codec;
	}

	// Run codec
	// Method in NdkMediaCodec.h
	r = AMediaCodec_start(decoder->codec);
	AMediaFormat_delete(format);
	if(r != AMEDIA_OK)
	{
		CHIAKI_LOGE(decoder->log, "AMediaCodec_start() failed: %d", (int)r);
		goto error_codec;
	}

	// Video frame output
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
bool android_chiaki_video_decoder_video_sample(uint8_t *buf, size_t buf_size, void *user)
{
	bool r = true;
	AndroidChiakiVideoDecoder *decoder = user;
	chiaki_mutex_lock(&decoder->codec_mutex);

	if(!decoder->codec)
	{
		CHIAKI_LOGE(decoder->log, "Received video data, but decoder is not initialized!");
		goto beach; // unlock process
	}

    clock_gettime(CLOCK_MONOTONIC, &decoder->stats.decode_start);

	while(buf_size > 0)
	{
		// send video stream to MediaCodec
		ssize_t codec_buf_index = AMediaCodec_dequeueInputBuffer(decoder->codec, INPUT_BUFFER_TIMEOUT_MS * 1000);
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

    bool waiting_for_keyframe = true;

	while(1)
	{
		AMediaCodecBufferInfo info;
		ssize_t status = AMediaCodec_dequeueOutputBuffer(decoder->codec, &info, -1);
		if(status >= 0)
		{
            // 检查是否为关键帧
            if(waiting_for_keyframe) {
                if(!(info.flags & 1)) {
                    // 丢弃非关键帧
                    AMediaCodec_releaseOutputBuffer(decoder->codec, (size_t)status, false);
                    continue;
                }
                waiting_for_keyframe = false;
            }

            struct timespec decode_end;
            clock_gettime(CLOCK_MONOTONIC, &decode_end);

            uint64_t frame_decode_time =
                    (decode_end.tv_sec - decoder->stats.decode_start.tv_sec) * 1000000000LL +
                    (decode_end.tv_nsec - decoder->stats.decode_start.tv_nsec);

            chiaki_mutex_lock(&decoder->codec_mutex);
            decoder->stats.total_decode_time_ns += frame_decode_time;
            decoder->stats.decoded_frames++;
            decoder->fps_stats.fps_frame_count++;

            if(decoder->stats.decoded_frames % 60 == 0) // 60fps
            {
                double avg_decode_time_ms =
                        (double)decoder->stats.total_decode_time_ns /
                        (double)decoder->stats.decoded_frames / 1000000.0;

//                CHIAKI_LOGI(decoder->log, "Average decode time: %.2f ms", avg_decode_time_ms);
                decoder->avg_decode_time = avg_decode_time_ms;
            }

            if(decoder->fps_stats.fps_frame_count % decoder->fps_stats.fps_update_interval == 0)
            {
                struct timespec current_time;
                clock_gettime(CLOCK_MONOTONIC, &current_time);

                double elapsed_seconds =
                        (current_time.tv_sec - decoder->fps_stats.fps_start_time.tv_sec) +
                        (current_time.tv_nsec - decoder->fps_stats.fps_start_time.tv_nsec) / 1e9;

                decoder->fps_stats.current_fps =
                        decoder->fps_stats.fps_frame_count / elapsed_seconds;

//                CHIAKI_LOGI(decoder->log, "FPS: %.2f", decoder->fps_stats.current_fps);

                decoder->fps_stats.fps_frame_count = 0;
                decoder->fps_stats.fps_start_time = current_time;
                decoder->avg_fps = decoder->fps_stats.current_fps;
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

    // Current decode time
    double final_avg_decode_time_ms =
            (double)decoder->stats.total_decode_time_ns /
            (double)decoder->stats.decoded_frames / 1000000.0;
    CHIAKI_LOGI(decoder->log, "Final average decode time: %.2f ms (%u frames)",
                final_avg_decode_time_ms, decoder->stats.decoded_frames);

	return NULL;
}