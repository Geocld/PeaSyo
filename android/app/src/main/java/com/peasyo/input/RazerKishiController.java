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
    private static final String TAG = "RazerKishiDebug";

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

    // HID 控制传输参数
    private static final int USB_DIR_OUT = 0x00;
    private static final int USB_TYPE_CLASS = 0x20;
    private static final int USB_RECIP_INTERFACE = 0x01;
    private static final int HID_SET_REPORT = 0x09;
    private static final int HID_REPORT_TYPE_FEATURE = 0x03;

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

        Log.d(TAG, "Checking device - VID: 0x" + Integer.toHexString(device.getVendorId()) +
                   ", PID: 0x" + Integer.toHexString(pid) +
                   ", Name: " + productName);

        // 匹配已知 PID
        if (pid == KISHI_ULTRA_PID_HID || pid == KISHI_V3_PID_HID ||
            pid == KISHI_V3_PRO_PID_HID || pid == KISHI_ULTRA_PID_XINPUT_PLUS ||
            pid == KISHI_V3_PID_XINPUT_PLUS || pid == KISHI_V3_PRO_PID_XINPUT_PLUS) {
            Log.i(TAG, "Device matched by PID: 0x" + Integer.toHexString(pid));
            return true;
        }

        // PID 0x37 是通用 XInput spoof PID，需要通过产品名称区分
        if (pid == 0x37 && productName != null) {
            String lowerName = productName.toLowerCase();
            boolean matched = lowerName.contains("kishi") || lowerName.contains("ultra");
            if (matched) {
                Log.i(TAG, "Device matched by name: " + productName);
            }
            return matched;
        }

        Log.d(TAG, "Device not matched");
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
        Log.i(TAG, "=== Starting Razer Kishi controller ===");
        Log.d(TAG, "Device info - VID: 0x" + Integer.toHexString(device.getVendorId()) +
                   ", PID: 0x" + Integer.toHexString(device.getProductId()) +
                   ", Name: " + device.getProductName() +
                   ", Interface count: " + device.getInterfaceCount());

        // 查找 Interface 3 的 INTERRUPT OUT 端点
        if (device.getInterfaceCount() <= HAPTIC_INTERFACE_INDEX) {
            Log.e(TAG, "Device does not have interface " + HAPTIC_INTERFACE_INDEX);
            return false;
        }

        hapticInterface = device.getInterface(HAPTIC_INTERFACE_INDEX);
        if (hapticInterface == null) {
            Log.e(TAG, "Failed to get haptic interface");
            return false;
        }

        Log.d(TAG, "Interface 3 found, endpoint count: " + hapticInterface.getEndpointCount());

        // 查找 INTERRUPT OUT 端点
        for (int i = 0; i < hapticInterface.getEndpointCount(); i++) {
            UsbEndpoint ep = hapticInterface.getEndpoint(i);
            Log.d(TAG, "Endpoint " + i + " - Type: " + ep.getType() +
                       ", Direction: " + ep.getDirection() +
                       ", Address: 0x" + Integer.toHexString(ep.getAddress()) +
                       ", MaxPacketSize: " + ep.getMaxPacketSize());

            if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_INT &&
                ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                hapticEndpoint = ep;
                Log.i(TAG, "Found INTERRUPT OUT endpoint at index " + i);
                break;
            }
        }

        if (hapticEndpoint == null) {
            Log.e(TAG, "Failed to find INTERRUPT OUT endpoint on interface 3");
            return false;
        }

        // Claim interface
        if (!connection.claimInterface(hapticInterface, true)) {
            Log.e(TAG, "Failed to claim haptic interface");
            return false;
        }

        Log.i(TAG, "Successfully claimed interface 3, endpoint address: 0x" +
                   Integer.toHexString(hapticEndpoint.getAddress()));
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
            Log.e(TAG, "Cannot start haptics: endpoint is null");
            return false;
        }

        if (!hapticEnabled) {
            // 先发送 SetHapticStateControl 命令启用左右声道触觉
            if (!sendHapticStateControl(true)) {
                Log.e(TAG, "Failed to enable haptic state");
                return false;
            }

            // 设置触觉强度为 HIGH (0x64 = 100)
            sendHapticIntensity((byte) 0x64);

            hapticSender.start(hapticEndpoint);
            hapticEnabled = true;
            Log.i(TAG, "=== Haptics started successfully ===");
        } else {
            Log.d(TAG, "Haptics already enabled");
        }
        return true;
    }

    public void stopHaptics() {
        if (hapticEnabled) {
            hapticSender.stop();
            hapticEnabled = false;
            resampleBuffer.clear();

            // 发送 SetHapticStateControl 命令关闭触觉
            sendHapticStateControl(false);

            Log.i(TAG, "Haptics stopped");
        }
    }

    /**
     * 发送 SetHapticStateControl 命令启用/关闭触觉
     */
    private boolean sendHapticStateControl(boolean enable) {
        byte state = enable ? (byte)0x01 : (byte)0x00;
        byte[] leftCmd  = new byte[] { 0x00, 0x01, state };
        byte[] rightCmd = new byte[] { 0x00, 0x02, state };
        boolean leftOk  = sendControlCommand("SetHapticStateControl", leftCmd);
        boolean rightOk = sendControlCommand("SetHapticStateControl", rightCmd);
        Log.i(TAG, "SetHapticStateControl(" + enable + ") - Left: " + leftOk + ", Right: " + rightOk);
        return leftOk && rightOk;
    }

    /**
     * 发送 SetHapticIntensity 命令设置触觉强度
     * LOW=0x21, MEDIUM=0x42, HIGH=0x64
     */
    private void sendHapticIntensity(byte intensity) {
        byte[] leftCmd  = new byte[] { 0x00, 0x01, intensity };
        byte[] rightCmd = new byte[] { 0x00, 0x02, intensity };
        boolean leftOk  = sendControlCommand("SetHapticIntensity", leftCmd);
        boolean rightOk = sendControlCommand("SetHapticIntensity", rightCmd);
        Log.i(TAG, "SetHapticIntensity(0x" + Integer.toHexString(intensity & 0xFF) +
                   ") - Left: " + leftOk + ", Right: " + rightOk);
    }

    /**
     * 通过 HID Feature Report 发送控制命令
     */
    private boolean sendControlCommand(String cmdName, byte[] data) {
        if (connection == null || hapticInterface == null) {
            return false;
        }

        // HID Feature Report: SET_REPORT
        int requestType = USB_DIR_OUT | USB_TYPE_CLASS | USB_RECIP_INTERFACE;
        int request = HID_SET_REPORT;
        int value = (HID_REPORT_TYPE_FEATURE << 8) | 0x00;  // Report ID = 0
        int index = hapticInterface.getId();

        int result = connection.controlTransfer(requestType, request, value, index, data, data.length, 1000);

        Log.d(TAG, "Control command '" + cmdName + "' result: " + result +
                   " (expected: " + data.length + ")");

        return result == data.length;
    }

    public boolean isHapticEnabled() {
        return hapticEnabled;
    }

    /**
     * 接收 PS5 触觉 PCM 数据（3kHz stereo int16），重采样到 4kHz 并发送
     */
    public void enqueueHapticData(byte[] pcmData, float gain) {
        if (!hapticEnabled) {
            Log.w(TAG, "Haptics not enabled, ignoring data");
            return;
        }

        if (pcmData == null || pcmData.length < 4) {
            Log.w(TAG, "Invalid PCM data: " + (pcmData == null ? "null" : "length=" + pcmData.length));
            return;
        }

        Log.d(TAG, "Received haptic data: " + pcmData.length + " bytes, gain: " + gain);

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
        Log.d(TAG, "Resampled: " + inputSamples.length + " -> " + resampled.length + " samples");

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

        int frameCount = 0;
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

            // 第一帧打印详细信息
            if (frameCount == 0) {
                StringBuilder hex = new StringBuilder();
                for (int i = 0; i < Math.min(20, frame.length); i++) {
                    hex.append(String.format("%02X ", frame[i]));
                }
                Log.d(TAG, "First frame hex (first 20 bytes): " + hex.toString());
                Log.d(TAG, "Frame size: " + frame.length + ", checksum: 0x" +
                      Integer.toHexString(checksum & 0xFF));
            }

            // 入队发送
            boolean enqueued = hapticSender.enqueue(frame);
            if (enqueued) {
                frameCount++;
            } else {
                Log.w(TAG, "Failed to enqueue frame (queue full?)");
            }
        }

        if (frameCount > 0) {
            Log.d(TAG, "Enqueued " + frameCount + " frames, buffer remaining: " + resampleBuffer.size() + " samples");
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
