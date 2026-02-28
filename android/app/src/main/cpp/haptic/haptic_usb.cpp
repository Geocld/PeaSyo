#include <jni.h>
#include <android/log.h>

#include <cerrno>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <mutex>
#include <vector>

#include <sys/ioctl.h>
#include <linux/usbdevice_fs.h>

#define HAPTIC_TAG "PS5HAPTIC"
#define HLOGE(...) __android_log_print(ANDROID_LOG_ERROR, HAPTIC_TAG, __VA_ARGS__)
#define HLOGI(...) __android_log_print(ANDROID_LOG_INFO, HAPTIC_TAG, __VA_ARGS__)

namespace {

constexpr int kInputChannels = 2; // L/R
constexpr int kOutputChannels = 4; // [0, 0, L, R]
constexpr int kBytesPerInputFrame = kInputChannels * static_cast<int>(sizeof(int16_t)); // 4
constexpr int kUpsampleFactor = 16; // 3kHz -> 48kHz

constexpr int kIsoPacketCount = 10;
constexpr int kIsoPacketSize = 392;
constexpr int kMaxOutputBytes = 4096;

std::mutex g_haptic_mutex;

int g_usb_fd = -1;
int g_haptic_iface = -1;
int g_haptic_alt_setting = -1;
uint8_t g_haptic_endpoint = 0;
bool g_haptic_enabled = false;

// enable 时一次性分配 4096 字节输出缓冲区
int16_t *g_upsampled_buffer = nullptr;

inline int16_t clamp_i16(int value)
{
    if (value > 32767) return 32767;
    if (value < -32768) return -32768;
    return static_cast<int16_t>(value);
}

// 双声道输入映射到四声道输出：[0, 0, L, R]
void expand_stereo_to_quad(const int16_t *input, int input_frames, int16_t *output)
{
    for (int i = 0; i < input_frames; i++) {
        const int16_t left = input[i * 2];
        const int16_t right = input[i * 2 + 1];
        output[i * 4] = 0;
        output[i * 4 + 1] = 0;
        output[i * 4 + 2] = left;
        output[i * 4 + 3] = right;
    }
}

// 线性插值上采样：3kHz -> 48kHz（x16）
void linear_upsample_3k_to_48k(const int16_t *input_quad, int input_frames, int16_t *output_quad)
{
    if (input_frames <= 0) {
        return;
    }

    const int last = input_frames - 1;
    const int out_frames = input_frames * kUpsampleFactor;

    for (int out_idx = 0; out_idx < out_frames; out_idx++) {
        const int src_idx = out_idx / kUpsampleFactor;
        const int phase = out_idx % kUpsampleFactor;
        const int next_idx = (src_idx < last) ? (src_idx + 1) : src_idx;

        for (int ch = 0; ch < kOutputChannels; ch++) {
            const int s0 = input_quad[src_idx * kOutputChannels + ch];
            const int s1 = input_quad[next_idx * kOutputChannels + ch];
            const int mixed = ((kUpsampleFactor - phase) * s0 + phase * s1) / kUpsampleFactor;
            output_quad[out_idx * kOutputChannels + ch] = clamp_i16(mixed);
        }
    }
}

} // namespace

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_peasyo_input_HapticNative_nativeConnectHaptics(
        JNIEnv *, jclass, jint fd, jint ifaceId, jint altSetting, jbyte epAddr)
{
    std::lock_guard<std::mutex> lock(g_haptic_mutex);

    if (fd < 0) {
        HLOGE("nativeConnectHaptics: invalid fd=%d", fd);
        return JNI_FALSE;
    }

    usbdevfs_setinterface set_interface {};
    set_interface.interface = ifaceId;
    set_interface.altsetting = altSetting;

    if (ioctl(fd, USBDEVFS_SETINTERFACE, &set_interface) != 0) {
        HLOGE("Failed to set interface, errno=%d", errno);
        return JNI_FALSE;
    }

    g_usb_fd = fd;
    g_haptic_iface = ifaceId;
    g_haptic_alt_setting = altSetting;
    g_haptic_endpoint = static_cast<uint8_t>(epAddr);
    g_haptic_enabled = false;

    HLOGI("nativeConnectHaptics ok: fd=%d iface=%d alt=%d ep=0x%02X",
          g_usb_fd, g_haptic_iface, g_haptic_alt_setting, g_haptic_endpoint);
    return JNI_TRUE;
}

JNIEXPORT jboolean JNICALL
Java_com_peasyo_input_HapticNative_nativeEnableHaptics(JNIEnv *, jclass)
{
    std::lock_guard<std::mutex> lock(g_haptic_mutex);

    if (g_usb_fd < 0) {
        return JNI_FALSE;
    }

    if (!g_upsampled_buffer) {
        g_upsampled_buffer = static_cast<int16_t *>(calloc(1, kMaxOutputBytes));
    }

    g_haptic_enabled = (g_upsampled_buffer != nullptr);
    return g_haptic_enabled ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_peasyo_input_HapticNative_nativeSendHapticFeedback(
        JNIEnv *env, jclass, jobject buffer, jint length)
{
    std::lock_guard<std::mutex> lock(g_haptic_mutex);

    if (g_usb_fd < 0 || !g_haptic_enabled || !g_upsampled_buffer || !buffer) {
        return JNI_FALSE;
    }

    auto *input = static_cast<int16_t *>(env->GetDirectBufferAddress(buffer));
    if (!input || length <= 0) {
        return JNI_FALSE;
    }

    const int input_frames = length / kBytesPerInputFrame;
    if (input_frames <= 0) {
        return JNI_FALSE;
    }

    std::vector<int16_t> quad(static_cast<size_t>(input_frames) * kOutputChannels);
    expand_stereo_to_quad(input, input_frames, quad.data());

    const int upsampled_frames = input_frames * kUpsampleFactor;
    const int output_samples = upsampled_frames * kOutputChannels;
    const int output_bytes = output_samples * static_cast<int>(sizeof(int16_t));
    if (output_bytes <= 0 || output_bytes > kMaxOutputBytes) {
        return JNI_FALSE;
    }

    linear_upsample_3k_to_48k(quad.data(), input_frames, g_upsampled_buffer);

    const size_t urb_size = sizeof(usbdevfs_urb) + static_cast<size_t>(kIsoPacketCount) * sizeof(usbdevfs_iso_packet_desc);
    auto *urb = static_cast<usbdevfs_urb *>(calloc(1, urb_size));
    if (!urb) {
        HLOGE("Failed to allocate URB");
        return JNI_FALSE;
    }

    urb->type = USBDEVFS_URB_TYPE_ISO;
    urb->endpoint = g_haptic_endpoint;
    urb->flags = USBDEVFS_URB_ISO_ASAP;
    urb->buffer = g_upsampled_buffer;
    urb->buffer_length = output_bytes;
    urb->number_of_packets = kIsoPacketCount;

    int remaining = output_bytes;
    for (int i = 0; i < kIsoPacketCount; i++) {
        const int chunk = (remaining >= kIsoPacketSize) ? kIsoPacketSize : remaining;
        urb->iso_frame_desc[i].length = (chunk > 0) ? chunk : 0;
        remaining -= chunk;
    }

    if (ioctl(g_usb_fd, USBDEVFS_SUBMITURB, urb) != 0) {
        HLOGE("Failed to submit URB, errno=%d", errno);
        free(urb);
        return JNI_FALSE;
    }

    void *reaped_urb = nullptr;
    if (ioctl(g_usb_fd, USBDEVFS_REAPURB, &reaped_urb) != 0) {
        HLOGE("Failed to reap URB, errno=%d", errno);
        free(urb);
        return JNI_FALSE;
    }

    // 如果回收到的不是本次 URB，额外释放该指针
    if (reaped_urb && reaped_urb != urb) {
        free(reaped_urb);
    }

    free(urb);
    return JNI_TRUE;
}

JNIEXPORT void JNICALL
Java_com_peasyo_input_HapticNative_nativeCleanupHaptics(JNIEnv *, jclass)
{
    std::lock_guard<std::mutex> lock(g_haptic_mutex);

    g_haptic_enabled = false;

    if (g_upsampled_buffer) {
        free(g_upsampled_buffer);
        g_upsampled_buffer = nullptr;
    }

    g_usb_fd = -1;
    g_haptic_iface = -1;
    g_haptic_alt_setting = -1;
    g_haptic_endpoint = 0;
}

} // extern "C"
