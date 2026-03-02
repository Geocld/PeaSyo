// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#ifndef CHIAKI_JNI_VIDEO_DECODER_H
#define CHIAKI_JNI_VIDEO_DECODER_H

#include <jni.h>
#include <stddef.h>
#include <stdint.h>
#include <time.h>

#include <chiaki/thread.h>
#include <chiaki/log.h>

typedef struct AMediaCodec AMediaCodec;
typedef struct ANativeWindow ANativeWindow;
typedef struct ALooper ALooper;

typedef struct android_chiaki_video_decoder_t
{
	ChiakiLog *log;
	ChiakiMutex codec_mutex;
	AMediaCodec *codec;
	ANativeWindow *window;
	uint64_t timestamp_cur;
	ChiakiThread output_thread;
	bool shutdown_output;
	bool output_thread_started;
	ChiakiThread choreographer_thread;
	bool shutdown_choreographer;
	bool choreographer_thread_started;
	bool choreographer_request_post;
	ALooper *choreographer_looper;
	int32_t target_width;
	int32_t target_height;
	ChiakiCodec target_codec;
	uint32_t stream_fps;
	int32_t frame_pacing;
	uint64_t frame_interval_ns;
	uint64_t last_render_time_ns;
	size_t output_buffer_queue[2];
	size_t output_buffer_queue_size;
	bool drop_pending_output;

    bool is_remote;

    struct {
        uint64_t total_decode_time_ns;
        uint32_t decoded_frames;
        struct timespec decode_start;
    } stats;

    struct {
        struct timespec fps_start_time;
        uint32_t fps_frame_count;
        float current_fps;
        uint32_t fps_update_interval;
    } fps_stats;

    float avg_fps;
    double avg_decode_time;
    int frames_lost;
} AndroidChiakiVideoDecoder;

ChiakiErrorCode android_chiaki_video_decoder_init(AndroidChiakiVideoDecoder *decoder, ChiakiLog *log, int32_t target_width, int32_t target_height, ChiakiCodec codec, bool remote, uint32_t stream_fps);
void android_chiaki_video_decoder_fini(AndroidChiakiVideoDecoder *decoder);
void android_chiaki_video_decoder_set_surface(AndroidChiakiVideoDecoder *decoder, JNIEnv *env, jobject surface, int32_t max_operating_rate, int32_t frame_pacing);
bool android_chiaki_video_decoder_video_sample(uint8_t *buf, size_t buf_size, int32_t frames_lost, bool frame_recovered, void *user);

#endif
