// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#ifndef CHIAKI_JNI_AUDIO_DECODER_H
#define CHIAKI_JNI_AUDIO_DECODER_H

#include <jni.h>

#include <chiaki/thread.h>
#include <chiaki/log.h>
#include <chiaki/audioreceiver.h>
#include <chiaki/session.h>

typedef void (*AndroidChiakiAudioDecoderSettingsCallback)(uint32_t channels, uint32_t rate, void *user);
typedef void (*AndroidChiakiAudioDecoderFrameCallback)(int16_t *buf, size_t samples_count, void *user);

typedef struct android_chiaki_audio_decoder_t
{
	ChiakiLog *log;
	ChiakiAudioHeader audio_header;

	ChiakiMutex codec_mutex;
	struct AMediaCodec *codec;
	uint64_t timestamp_cur;
	ChiakiThread output_thread;

	AndroidChiakiAudioDecoderSettingsCallback settings_cb;
	AndroidChiakiAudioDecoderFrameCallback frame_cb;
	void *cb_user;
} AndroidChiakiAudioDecoder;

typedef struct {
    uint64_t last_frame_time;    // 上次接收帧的时间
    uint16_t last_left;          // 上次的左值
    uint16_t last_right;         // 上次的右值
    uint16_t stable_left;        // 稳定状态的左值
    uint16_t stable_right;       // 稳定状态的右值
    bool is_vibrating;           // 当前是否在振动
    int stable_count;            // 稳定值计数器
    uint64_t last_event_time;  // 上次发送事件的时间
    bool is_initialized;       // 是否已初始化稳定值
} AudioHapticsState;

ChiakiErrorCode android_chiaki_audio_decoder_init(AndroidChiakiAudioDecoder *decoder, ChiakiLog *log);
void android_chiaki_audio_decoder_fini(AndroidChiakiAudioDecoder *decoder);
void android_chiaki_audio_decoder_get_sink(AndroidChiakiAudioDecoder *decoder, ChiakiAudioSink *sink);
void android_chiaki_audio_haptics_decoder_get_sink(ChiakiSession *session, AndroidChiakiAudioDecoder *decoder, ChiakiAudioSink *sink);

static inline void android_chiaki_audio_decoder_set_cb(AndroidChiakiAudioDecoder *decoder, AndroidChiakiAudioDecoderSettingsCallback settings_cb, AndroidChiakiAudioDecoderFrameCallback frame_cb, void *user)
{
	decoder->settings_cb = settings_cb;
	decoder->frame_cb = frame_cb;
	decoder->cb_user = user;
}

#endif