// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#include "audio-output.h"

#include "circular-buf.hpp"

#include <chiaki/log.h>
#include <chiaki/thread.h>

#include <oboe/Oboe.h>

#define BUFFER_CHUNK_SIZE 1024
#define BUFFER_CHUNKS_COUNT 32

using AudioBuffer = CircularBuffer<BUFFER_CHUNKS_COUNT, BUFFER_CHUNK_SIZE>;

class AudioOutput;

class AudioOutputCallback: public oboe::AudioStreamCallback
{
private:
	AudioOutput *audio_output;

public:
	AudioOutputCallback(AudioOutput *audio_output) : audio_output(audio_output) {}
	oboe::DataCallbackResult onAudioReady(oboe::AudioStream *stream, void *audioData, int32_t numFrames) override;
	void onErrorBeforeClose(oboe::AudioStream *stream, oboe::Result error) override;
	void onErrorAfterClose(oboe::AudioStream *stream, oboe::Result error) override;
};

struct AudioOutput
{
	ChiakiLog *log;
	oboe::ManagedStream stream;
	AudioOutputCallback stream_callback;
	AudioBuffer buf;
	int32_t preferred_device_id;
	oboe::SharingMode sharing_mode;
	uint64_t callback_count;  // 记录 onAudioReady 被调用的次数
	uint64_t frame_count;     // 记录推送的音频帧数

	AudioOutput() : stream_callback(this), preferred_device_id(-1), sharing_mode(oboe::SharingMode::Shared), callback_count(0), frame_count(0) {}
};

extern "C" void *android_chiaki_audio_output_new(ChiakiLog *log)
{
	auto r = new AudioOutput();
	r->log = log;
	return r;
}

extern "C" void android_chiaki_audio_output_free(void *audio_output)
{
	if(!audio_output)
		return;
	auto ao = reinterpret_cast<AudioOutput *>(audio_output);
	ao->stream = nullptr;
	delete ao;
}

extern "C" void android_chiaki_audio_output_set_device_id(int32_t device_id, void *audio_output)
{
	if(!audio_output)
		return;
	auto ao = reinterpret_cast<AudioOutput *>(audio_output);
	ao->preferred_device_id = device_id;
	CHIAKI_LOGI(ao->log, "Audio Output preferred device id set to %d", device_id);
}

extern "C" void android_chiaki_audio_output_set_sharing_mode(int32_t sharing_mode, void *audio_output)
{
	if(!audio_output)
		return;
	auto ao = reinterpret_cast<AudioOutput *>(audio_output);
	if(sharing_mode == 1)
		ao->sharing_mode = oboe::SharingMode::Exclusive;
	else
		ao->sharing_mode = oboe::SharingMode::Shared;

	CHIAKI_LOGI(ao->log, "Audio Output sharing mode set to %s", sharing_mode == 1 ? "exclusive" : "shared");
}

extern "C" void android_chiaki_audio_output_settings(uint32_t channels, uint32_t rate, void *audio_output)
{
	auto ao = reinterpret_cast<AudioOutput *>(audio_output);

	CHIAKI_LOGI(ao->log, "Audio Output settings: channels=%u, rate=%u", channels, rate);
	CHIAKI_LOGI(ao->log, "Audio Output preferred_device_id=%d", ao->preferred_device_id);
	CHIAKI_LOGI(ao->log, "Audio Output requested sharing_mode=%s",
		ao->sharing_mode == oboe::SharingMode::Exclusive ? "Exclusive" : "Shared");

	// 方案1：当指定设备ID时，强制使用 SHARED 模式以提高兼容性
	oboe::SharingMode actual_sharing_mode = ao->sharing_mode;
	if(ao->preferred_device_id >= 0 && ao->sharing_mode == oboe::SharingMode::Exclusive)
	{
		actual_sharing_mode = oboe::SharingMode::Shared;
		CHIAKI_LOGI(ao->log, "Audio Output forcing SHARED mode when device_id is specified (compatibility fix)");
	}

	oboe::AudioStreamBuilder builder;
	builder.setPerformanceMode(oboe::PerformanceMode::LowLatency)
		->setSharingMode(actual_sharing_mode)
		->setFormat(oboe::AudioFormat::I16)
		->setChannelCount(channels)
		->setSampleRate(rate)
		->setCallback(&ao->stream_callback);

	if(ao->preferred_device_id >= 0)
	{
		builder.setDeviceId(ao->preferred_device_id);
		CHIAKI_LOGI(ao->log, "Audio Output setting device ID to %d", ao->preferred_device_id);
	}
	else
	{
		CHIAKI_LOGI(ao->log, "Audio Output using system default device (device_id=-1)");
	}

	auto result = builder.openManagedStream(ao->stream);
	if(result == oboe::Result::OK)
	{
		CHIAKI_LOGI(ao->log, "Audio Output opened Oboe stream successfully");

		// 记录实际打开的流的配置
		auto stream = ao->stream.get();
		CHIAKI_LOGI(ao->log, "Audio Output stream actual config:");
		CHIAKI_LOGI(ao->log, "  - Device ID: %d", stream->getDeviceId());
		CHIAKI_LOGI(ao->log, "  - Sample Rate: %d", stream->getSampleRate());
		CHIAKI_LOGI(ao->log, "  - Channel Count: %d", stream->getChannelCount());
		CHIAKI_LOGI(ao->log, "  - Format: %s", oboe::convertToText(stream->getFormat()));
		CHIAKI_LOGI(ao->log, "  - Sharing Mode: %s", oboe::convertToText(stream->getSharingMode()));
		CHIAKI_LOGI(ao->log, "  - Performance Mode: %s", oboe::convertToText(stream->getPerformanceMode()));
		CHIAKI_LOGI(ao->log, "  - Buffer Capacity (frames): %d", stream->getBufferCapacityInFrames());
		CHIAKI_LOGI(ao->log, "  - Buffer Size (frames): %d", stream->getBufferSizeInFrames());
		CHIAKI_LOGI(ao->log, "  - Frames Per Burst: %d", stream->getFramesPerBurst());
		CHIAKI_LOGI(ao->log, "  - Bytes Per Frame: %d", stream->getBytesPerFrame());
	}
	else
	{
		CHIAKI_LOGE(ao->log, "Audio Output failed to open Oboe stream: %s", oboe::convertToText(result));
		return;
	}

	result = ao->stream->start();
	if(result == oboe::Result::OK)
	{
		CHIAKI_LOGI(ao->log, "Audio Output started Oboe stream successfully");
		CHIAKI_LOGI(ao->log, "Audio Output stream state: %s", oboe::convertToText(ao->stream->getState()));
	}
	else
	{
		CHIAKI_LOGE(ao->log, "Audio Output failed to start Oboe stream: %s", oboe::convertToText(result));
	}
}

extern "C" void android_chiaki_audio_output_frame(int16_t *buf, size_t samples_count, void *audio_output)
{
	auto ao = reinterpret_cast<AudioOutput *>(audio_output);

	size_t buf_size = samples_count * sizeof(int16_t);
	size_t pushed = ao->buf.Push(reinterpret_cast<uint8_t *>(buf), buf_size);

	ao->frame_count++;

	// 每 300 帧（约 5 秒）记录一次统计信息
	if(ao->frame_count % 300 == 0)
	{
		CHIAKI_LOGI(ao->log, "Audio Output stats: pushed_frames=%llu, callback_count=%llu, ratio=%.2f",
			(unsigned long long)ao->frame_count,
			(unsigned long long)ao->callback_count,
			ao->callback_count > 0 ? (double)ao->frame_count / ao->callback_count : 0.0);
	}

	if(pushed < buf_size)
	{
		CHIAKI_LOGW(ao->log, "Audio Output Buffer Overflow! (pushed %zu/%zu bytes, frame=%llu, callback=%llu)",
			pushed, buf_size, (unsigned long long)ao->frame_count, (unsigned long long)ao->callback_count);
	}
}

oboe::DataCallbackResult AudioOutputCallback::onAudioReady(oboe::AudioStream *stream, void *audio_data, int32_t num_frames)
{
	audio_output->callback_count++;

	// 每 1000 次回调记录一次（避免日志过多）
	if(audio_output->callback_count % 1000 == 1)
	{
		CHIAKI_LOGI(audio_output->log, "Audio Output onAudioReady: callback_count=%llu, num_frames=%d, state=%s",
			(unsigned long long)audio_output->callback_count,
			num_frames,
			oboe::convertToText(stream->getState()));
	}

	if(stream->getFormat() != oboe::AudioFormat::I16)
	{
		CHIAKI_LOGE(audio_output->log, "Oboe stream has invalid format in callback: %s",
			oboe::convertToText(stream->getFormat()));
		return oboe::DataCallbackResult::Stop;
	}

	int32_t bytes_per_frame = stream->getBytesPerFrame();
	size_t buf_size_requested = static_cast<size_t>(bytes_per_frame * num_frames);
	auto buf = reinterpret_cast<uint8_t *>(audio_data);

	size_t buf_size_delivered = audio_output->buf.Pop(buf, buf_size_requested);

	if(buf_size_delivered < buf_size_requested)
	{
		CHIAKI_LOGV(audio_output->log, "Audio Output Buffer Underflow! (delivered %zu/%zu bytes)",
			buf_size_delivered, buf_size_requested);
		memset(buf + buf_size_delivered, 0, buf_size_requested - buf_size_delivered);
	}

	return oboe::DataCallbackResult::Continue;
}

void AudioOutputCallback::onErrorBeforeClose(oboe::AudioStream *stream, oboe::Result error)
{
	CHIAKI_LOGE(audio_output->log, "Oboe reported error before close: %s", oboe::convertToText(error));
}

void AudioOutputCallback::onErrorAfterClose(oboe::AudioStream *stream, oboe::Result error)
{
	CHIAKI_LOGE(audio_output->log, "Oboe reported error after close: %s", oboe::convertToText(error));
}
