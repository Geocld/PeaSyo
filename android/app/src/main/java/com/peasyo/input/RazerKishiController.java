package com.peasyo.input;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

/**
 * Razer Kishi V3/Ultra 触觉音频控制器
 * 支持通过 Interface 3 INTERRUPT OUT 端点发送 Raw PCM 触觉数据
 */
public class RazerKishiController extends AbstractController {
    private static final String TAG = "RazerKishi";

    private static final int RAZER_VID = 0x1532;

    // Kishi Ultra PIDs
    private static final int KISHI_ULTRA_PID_XINPUT = 0x37;
    private static final int KISHI_ULTRA_PID_XINPUT_PLUS = 0x719;
    private static final int KISHI_ULTRA_PID_HID = 0x71a;

    // Kishi V3 PIDs
    private static final int KISHI_V3_PID_XINPUT = 0x37;
    private static final int KISHI_V3_PID_XINPUT_PLUS = 0x719;
    private static final int KISHI_V3_PID_HID = 0x721;

    // Kishi V3 Pro PIDs
    private static final int KISHI_V3_PRO_PID_XINPUT = 0x37;
    private static final int KISHI_V3_PRO_PID_XINPUT_PLUS = 0x719;
    private static final int KISHI_V3_PRO_PID_HID = 0x724;

    // 触觉端点配置
    private static final int HAPTIC_INTERFACE_INDEX = 3;
    private static final int FRAME_SIZE = 64;
    private static final int HEADER_SIZE = 10;
    private static final int PAYLOAD_SIZE = 48;
    private static final int CHECKSUM_SIZE = 1;
    private static final int PADDING_SIZE = 5;

    // 采样率配置
    private static final int INPUT_SAMPLE_RATE = 3000;  // PS5 触觉采样率
    private static final int OUTPUT_SAMPLE_RATE = 4000; // Razer 触觉采样率
    private static final int SAMPLES_PER_FRAME = 12;    // 每帧 12 个立体声样本

    // 帧头
    private static final byte[] FRAME_HEADER = {
        (byte)0x55, (byte)0xAA, 0x00, 0x00, 0x00, 0x00, 0x00,
        (byte)PAYLOAD_SIZE,  // payload size
        (byte)0xFE,
        (byte)0x79           // stereo command
    };

    private final UsbDevice device;
    private final UsbDeviceConnection connection;
    private UsbInterface hapticInterface;
    private UsbEndpoint hapticEndpoint;
    private RazerKishiHapticSender hapticSender;

    private boolean hapticEnabled = false;
    private final List<Short> resampleBuffer = new ArrayList<>();

    public static boolean canClaimDevice(UsbDevice device) {
        if (device.getVendorId() != RAZER_VID) {
            return false;
        }

        int pid = device.getProductId();
        String productName = device.getProductName();

        // 匹配已知 PID
        if (pid == KISHI_ULTRA_PID_HID || pid == KISHI_V3_PID_HID ||
            pid == KISHI_V3_PRO_PID_HID || pid == KISHI_ULTRA_PID_XINPUT_PLUS ||
            pid == KISHI_V3_PID_XINPUT_PLUS || pid == KISHI_V3_PRO_PID_XINPUT_PLUS) {
            return true;
        }

        // PID 0x37 是通用 XInput spoof PID，需要通过产品名称区分
        if (pid == 0x37 && productName != null) {
            String lowerName = productName.toLowerCase();
            return lowerName.contains("kishi") || lowerName.contains("ultra");
        }

        return false;
    }

    public RazerKishiController(UsbDevice device, UsbDeviceConnection connection,
                                int deviceId, UsbDriverListener listener) {
        super(deviceId, listener, device.getVendorId(), device.getProductId());
        this.device = device;
        this.connection = connection;
        this.hapticSender = new RazerKishiHapticSender(connection);
    }

    @Override
    public boolean start() {
        Log.d(TAG, "Starting Razer Kishi controller");

        // 查找 Interface 3 的 INTERRUPT OUT 端点
        if (device.getInterfaceCount() <= HAPTIC_INTERFACE_INDEX) {
            Log.w(TAG, "Device does not have interface " + HAPTIC_INTERFACE_INDEX);
            return false;
        }

        hapticInterface = device.getInterface(HAPTIC_INTERFACE_INDEX);
        if (hapticInterface == null) {
            Log.w(TAG, "Failed to get haptic interface");
            return false;
        }

        // 查找 INTERRUPT OUT 端点
        for (int i = 0; i < hapticInterface.getEndpointCount(); i++) {
            UsbEndpoint ep = hapticInterface.getEndpoint(i);
            if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_INT &&
                ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                hapticEndpoint = ep;
                break;
            }
        }

        if (hapticEndpoint == null) {
            Log.w(TAG, "Failed to find INTERRUPT OUT endpoint on interface 3");
            return false;
        }

        // Claim interface
        if (!connection.claimInterface(hapticInterface, true)) {
            Log.e(TAG, "Failed to claim haptic interface");
            return false;
        }

        Log.i(TAG, "Razer Kishi haptic endpoint found: " + hapticEndpoint.getAddress());
        notifyDeviceAdded();
        return true;
    }

    @Override
    public void stop() {
        Log.d(TAG, "Stopping Razer Kishi controller");
        stopHaptics();

        if (hapticInterface != null && connection != null) {
            connection.releaseInterface(hapticInterface);
        }

        notifyDeviceRemoved();
    }

    public boolean hasHapticEndpoint() {
        return hapticEndpoint != null;
    }

    public boolean startHaptics() {
        if (hapticEndpoint == null) {
            return false;
        }

        if (!hapticEnabled) {
            hapticSender.start(hapticEndpoint);
            hapticEnabled = true;
            Log.i(TAG, "Haptics started");
        }
        return true;
    }

    public void stopHaptics() {
        if (hapticEnabled) {
            hapticSender.stop();
            hapticEnabled = false;
            resampleBuffer.clear();
            Log.i(TAG, "Haptics stopped");
        }
    }

    public boolean isHapticEnabled() {
        return hapticEnabled;
    }

    /**
     * 接收 PS5 触觉 PCM 数据（3kHz stereo int16），重采样到 4kHz 并发送
     */
    public void enqueueHapticData(byte[] pcmData, float gain) {
        if (!hapticEnabled || pcmData == null || pcmData.length < 4) {
            return;
        }

        // 将 byte[] 转换为 short[] (little-endian)
        int sampleCount = pcmData.length / 2;
        short[] inputSamples = new short[sampleCount];
        for (int i = 0; i < sampleCount; i++) {
            int b0 = pcmData[i * 2] & 0xFF;
            int b1 = pcmData[i * 2 + 1] & 0xFF;
            inputSamples[i] = (short)((b1 << 8) | b0);
        }

        // 重采样 3kHz -> 4kHz (比例 4/3)
        short[] resampled = resample3kTo4k(inputSamples);

        // 应用增益
        if (gain != 1.0f) {
            for (int i = 0; i < resampled.length; i++) {
                int val = (int)(resampled[i] * gain);
                resampled[i] = (short)Math.max(-32768, Math.min(32767, val));
            }
        }

        // 打包成 64B 帧并入队
        packAndEnqueueFrames(resampled);
    }

    /**
     * 线性插值重采样：3kHz -> 4kHz
     */
    private short[] resample3kTo4k(short[] input) {
        int inputLen = input.length;
        int outputLen = (int)Math.ceil(inputLen * 4.0 / 3.0);
        short[] output = new short[outputLen];

        for (int i = 0; i < outputLen; i++) {
            double pos = i * 3.0 / 4.0;
            int idx0 = (int)Math.floor(pos);
            int idx1 = Math.min(idx0 + 1, inputLen - 1);
            double frac = pos - idx0;

            if (idx0 >= inputLen) {
                output[i] = 0;
            } else {
                double val = input[idx0] * (1.0 - frac) + input[idx1] * frac;
                output[i] = (short)Math.max(-32768, Math.min(32767, val));
            }
        }

        return output;
    }

    /**
     * 将重采样后的样本打包成 64B 帧（每帧 12 stereo samples）
     */
    private void packAndEnqueueFrames(short[] samples) {
        // 将新样本加入缓冲区
        for (short s : samples) {
            resampleBuffer.add(s);
        }

        // 每 24 个 short（12 stereo samples）打包一帧
        while (resampleBuffer.size() >= SAMPLES_PER_FRAME * 2) {
            byte[] frame = new byte[FRAME_SIZE];

            // 复制帧头
            System.arraycopy(FRAME_HEADER, 0, frame, 0, HEADER_SIZE);

            // 填充 payload（48 bytes = 24 shorts）
            for (int i = 0; i < SAMPLES_PER_FRAME * 2; i++) {
                short sample = resampleBuffer.remove(0);
                int offset = HEADER_SIZE + i * 2;
                frame[offset] = (byte)(sample & 0xFF);
                frame[offset + 1] = (byte)((sample >> 8) & 0xFF);
            }

            // 计算 checksum (XOR from index 2 to 57)
            byte checksum = 0;
            for (int i = 2; i < HEADER_SIZE + PAYLOAD_SIZE; i++) {
                checksum ^= frame[i];
            }
            frame[HEADER_SIZE + PAYLOAD_SIZE] = checksum;

            // 填充末尾 5 字节为 0（已经是 0）

            // 入队发送
            hapticSender.enqueue(frame);
        }
    }

    @Override
    public void rumble(short lowFreqMotor, short highFreqMotor) {
        // Android 原生驱动处理手柄输入，这里不需要实现
    }

    @Override
    public void rumbleTriggers(short leftTrigger, short rightTrigger) {
        // Android 原生驱动处理手柄输入，这里不需要实现
    }

    @Override
    public void sendCommand(byte[] data) {
        // Android 原生驱动处理手柄输入，这里不需要实现
    }
}
