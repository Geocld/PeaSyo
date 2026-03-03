package com.peasyo.input;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.os.SystemClock;
import android.util.Log;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public abstract class AbstractDualSenseController extends AbstractController {
    private static final String TAG = "PS5HAPTIC";
    // DualSense 触觉音频端点特征：等时 OUT 且 maxPacketSize = 0x188(392)
    private static final int ISO_EP_MAX_PACKET = 0x188;
    private static final int HAPTIC_INIT_REPORT_SIZE = 48;
    private static final int HAPTIC_INIT_TIMEOUT_MS = 100;
    // Prime 瞬时失效后给一点宽限，避免误触发 rumble 降级
    private static final long HAPTIC_ACTIVE_GRACE_MS = 600L;
    private static final int TRIGGER_DATA_LEN = 7;
    private static final int REPORT_RIGHT_TRIGGER_TYPE_IDX = 11;
    private static final int REPORT_RIGHT_TRIGGER_DATA_IDX = 12;
    private static final int REPORT_LEFT_TRIGGER_TYPE_IDX = 22;
    private static final int REPORT_LEFT_TRIGGER_DATA_IDX = 23;
    private static final int REPORT_MIN_TRIGGER_LEN = 30;

    protected final UsbDevice device;
    protected final UsbDeviceConnection connection;

    private Thread inputThread;
    private boolean stopped;

    protected UsbEndpoint inEndpt, outEndpt;

    // 触觉端点信息（由 start() 扫描得到）
    private int hapticInterfaceId = -1;
    private int hapticAltSetting = -1;
    private byte hapticEndpointAddr = 0;

    private DualSenseHapticSender hapticSender;
    private volatile boolean hapticEnabled = false;
    // 首次真正发送前先下发 0x02 0x0c 0x40 的初始化包
    private boolean hapticPrimed = false;
    private int hapticPrimeRetryCount = 0;
    private volatile long lastPrimeSuccessAtMs = 0L;
    // 缓存最近一次触发器参数，避免 prime 包把触发器效果清零
    private byte cachedLeftTriggerType = 0x00;
    private final byte[] cachedLeftTriggerData = new byte[TRIGGER_DATA_LEN];
    private byte cachedRightTriggerType = 0x00;
    private final byte[] cachedRightTriggerData = new byte[TRIGGER_DATA_LEN];

    public AbstractDualSenseController(UsbDevice device, UsbDeviceConnection connection, int deviceId, UsbDriverListener listener) {
        super(deviceId, listener, device.getVendorId(), device.getProductId());
        this.device = device;
        this.connection = connection;
        this.buttonFlags =
                DSControllerPacket.CROSS_FLAG | DSControllerPacket.MOON_FLAG | DSControllerPacket.BOX_FLAG | DSControllerPacket.PYRAMID_FLAG |
                        DSControllerPacket.LEFT_FLAG | DSControllerPacket.RIGHT_FLAG | DSControllerPacket.UP_FLAG | DSControllerPacket.DOWN_FLAG |
                        DSControllerPacket.L1_FLAG | DSControllerPacket.R1_FLAG |
                        DSControllerPacket.L3_FLAG | DSControllerPacket.R3_FLAG |
                        DSControllerPacket.OPTIONS_FLAG | DSControllerPacket.SHARE_FLAG | DSControllerPacket.TOUCHPAD_FLAG | DSControllerPacket.PS_FLAG | DSControllerPacket.MUTE_FLAG;
    }

    private Thread createInputThread() {
        return new Thread() {
            public void run() {
                try {
                    // Delay for a moment before reporting the new gamepad and
                    // accepting new input. This allows time for the old InputDevice
                    // to go away before we reclaim its spot. If the old device is still
                    // around when we call notifyDeviceAdded(), we won't be able to claim
                    // the controller number used by the original InputDevice.
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    return;
                }

                // Report that we're added _before_ reporting input
                notifyDeviceAdded();

                while (!isInterrupted() && !stopped) {
                    byte[] buffer = new byte[64];

                    int res;

                    //
                    // There's no way that I can tell to determine if a device has failed
                    // or if the timeout has simply expired. We'll check how long the transfer
                    // took to fail and assume the device failed if it happened before the timeout
                    // expired.
                    //

                    do {
                        // Read the next input state packet
                        long lastMillis = SystemClock.uptimeMillis();
                        res = connection.bulkTransfer(inEndpt, buffer, buffer.length, 3000);
//                        Log.d("UsbDriverService AbstractDualSenseController.java", "bulkTransfer result:" + res);

                        // If we get a zero length response, treat it as an error
                        if (res == 0) {
                            res = -1;
                        }

                        if (res == -1 && SystemClock.uptimeMillis() - lastMillis < 1000) {
                            Log.d("UsbDriverService AbstractDualSenseController.java", "Detected device I/O error");
                            AbstractDualSenseController.this.stop();
                            break;
                        }
                    } while (res == -1 && !isInterrupted() && !stopped);

                    if (res == -1 || stopped) {
                        break;
                    }

                    if (handleRead(ByteBuffer.wrap(buffer, 0, res).order(ByteOrder.LITTLE_ENDIAN))) {
                        // Report input if handleRead() returns true
                        reportDsInput();
                    }
                }
            }
        };
    }

    private static UsbInterface findInterface(UsbDevice device) {
        int count = device.getInterfaceCount();

        for (int i = 0; i < count; i++) {
            UsbInterface intf = device.getInterface(i);
//            Log.d("UsbDriverService AbstractDualSenseController.java", "Interface " + i +
//                    ": class=" + String.format("0x%02X", intf.getInterfaceClass()) +
//                    " subclass=" + String.format("0x%02X", intf.getInterfaceSubclass()) +
//                    " protocol=" + String.format("0x%02X", intf.getInterfaceProtocol()) +
//                    " endpoints=" + intf.getEndpointCount());
//
//            if (i == 0) {
//                for (int j = 0; j < intf.getEndpointCount(); j++) {
//                    UsbEndpoint endpoint = intf.getEndpoint(j);
//                    Log.d("UsbDriverService", "Endpoint " + j +
//                            ": address=0x" + String.format("%02X", endpoint.getAddress()) +
//                            " type=" + endpoint.getType() +
//                            " direction=" + (endpoint.getDirection() == UsbConstants.USB_DIR_OUT ? "OUT" : "IN"));
//                }
//                return intf;
//            }
            if (intf.getInterfaceClass() == UsbConstants.USB_CLASS_HID) {
                Log.d("UsbDriverService", "Found HID interface: " + i);
                return intf;
            }
        }
        return null;
    }

    public boolean start() {
        Log.d("UsbDriverService AbstractDualSenseController.java", "start");

        // Force claim all interfaces
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            UsbInterface iface = device.getInterface(i);

            if (!connection.claimInterface(iface, true)) {
                Log.d("UsbDriverService AbstractDualSenseController.java", "Failed to claim interfaces");
                return false;
            }
        }

        Log.d("UsbDriverService AbstractDualSenseController.java", "getInterfaceCount:" + device.getInterfaceCount());

        // 扫描音频接口里的等时 OUT 端点，用于后续触觉音频发送
        detectHapticEndpoint();

        // Find the endpoints
        UsbInterface iface = findInterface(device);

        if (iface == null) {
            Log.e("UsbDriverService AbstractDualSenseController.java", "Failed to find interface");
            return false;
        }

        for (int i = 0; i < iface.getEndpointCount(); i++) {
            UsbEndpoint endpt = iface.getEndpoint(i);
            if (endpt.getDirection() == UsbConstants.USB_DIR_OUT) {
                if (outEndpt != null) {
                    Log.d("UsbDriverService AbstractDualSenseController.java", "Found duplicate OUT endpoint");
                    return false;
                }
                outEndpt = endpt;
            } else if (endpt.getDirection() == UsbConstants.USB_DIR_IN) {
                if (inEndpt != null) {
                    Log.d("UsbDriverService AbstractDualSenseController.java", "Found duplicate IN endpoint");
                    return false;
                }
                inEndpt = endpt;
            }
        }

        Log.d("UsbDriverService AbstractDualSenseController.java", "inEndpt: " + inEndpt);
        Log.d("UsbDriverService AbstractDualSenseController.java", "outEndpt: " + outEndpt);

        // Make sure the required endpoints were present
        if (inEndpt == null || outEndpt == null) {
            Log.d("UsbDriverService AbstractDualSenseController.java", "Missing required endpoin");
            return false;
        }

        // Run the init function
        if (!doInit()) {
            return false;
        }

        // Start listening for controller input
        inputThread = createInputThread();
        inputThread.start();

//        rumble((short)65535, (short)65535);

        return true;
    }

    public void stop() {
        if (stopped) {
            return;
        }

        stopped = true;
        stopHaptics();

        // Cancel any rumble effects
        rumble((short)0, (short)0);

        // Stop the input thread
        if (inputThread != null) {
            inputThread.interrupt();
            inputThread = null;
        }

        // Close the USB connection
        connection.close();

        // Report the device removed
        notifyDeviceRemoved();
    }

    private void detectHapticEndpoint() {
        hapticInterfaceId = -1;
        hapticAltSetting = -1;
        hapticEndpointAddr = 0;

        for (int i = 0; i < device.getInterfaceCount(); i++) {
            UsbInterface iface = device.getInterface(i);
            if (iface.getInterfaceClass() != UsbConstants.USB_CLASS_AUDIO) {
                continue;
            }
            for (int j = 0; j < iface.getEndpointCount(); j++) {
                UsbEndpoint ep = iface.getEndpoint(j);
                if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_ISOC
                        && ep.getDirection() == UsbConstants.USB_DIR_OUT
                        && ep.getMaxPacketSize() == ISO_EP_MAX_PACKET) {
                    hapticInterfaceId = iface.getId();
                    hapticAltSetting = iface.getAlternateSetting();
                    hapticEndpointAddr = (byte) ep.getAddress();
                    Log.i(TAG, "发现 DualSense 触觉端点: iface=" + hapticInterfaceId
                            + ", alt=" + hapticAltSetting
                            + ", ep=0x" + String.format("%02X", ep.getAddress()));
                    return;
                }
            }
        }
    }

    /**
     * 启动 DualSense 触觉模式（ioctl + URB）
     */
    public synchronized boolean startHaptics() {
        if (hapticEnabled) {
            return true;
        }
        if (hapticInterfaceId < 0) {
            Log.w(TAG, "未检测到触觉端点，无法启动触觉反馈");
            return false;
        }

        final int fd = connection.getFileDescriptor();
        if (fd < 0) {
            Log.w(TAG, "UsbDeviceConnection fd 无效");
            return false;
        }

        if (!HapticNative.nativeConnectHaptics(fd, hapticInterfaceId, hapticAltSetting, hapticEndpointAddr)) {
            return false;
        }
        if (!HapticNative.nativeEnableHaptics()) {
            HapticNative.nativeCleanupHaptics();
            return false;
        }

        hapticSender = new DualSenseHapticSender();
        hapticSender.start();
        hapticPrimed = false;
        hapticPrimeRetryCount = 0;
        lastPrimeSuccessAtMs = 0L;
        hapticEnabled = true;
        return true;
    }

    /**
     * 停止触觉模式并释放 native 资源
     */
    public synchronized void stopHaptics() {
        hapticEnabled = false;
        hapticPrimed = false;
        hapticPrimeRetryCount = 0;
        lastPrimeSuccessAtMs = 0L;

        if (hapticSender != null) {
            hapticSender.stop();
            hapticSender = null;
        }

        HapticNative.nativeCleanupHaptics();
    }

    /**
     * 入队一帧触觉音频数据
     */
    public void enqueueHapticData(byte[] frame) {
        if (!hapticEnabled || frame == null || frame.length == 0) {
            return;
        }
        final DualSenseHapticSender sender = hapticSender;
        if (sender == null) {
            return;
        }

        if (!hapticPrimed) {
            // 仅在初始化包真实下发成功后才进入触觉帧发送
            if (!tryPrimeHaptics()) {
                return;
            }
        }

        sender.enqueue(frame);
    }

    public boolean isHapticEnabled() {
        if (!hapticEnabled) {
            return false;
        }
        if (hapticPrimed) {
            return true;
        }
        // prime 被重置后给短暂宽限，避免瞬时 false 导致走 rumble 降级
        final long lastOk = lastPrimeSuccessAtMs;
        return lastOk > 0 && (SystemClock.uptimeMillis() - lastOk) <= HAPTIC_ACTIVE_GRACE_MS;
    }

    public boolean hasHapticEndpoint() {
        return hapticInterfaceId >= 0;
    }

    protected abstract boolean handleRead(ByteBuffer buffer);
    protected abstract boolean doInit();

    /**
     * 发送普通 HID 输出报告（灯光/扳机/rumble）后，触觉链路可能需要重新 prime。
     * 该标志置回 false 后，下一帧触觉会自动触发 init 包重试。
     */
    protected synchronized void invalidateHapticPrime() {
        if (hapticEnabled && hapticPrimed) {
            hapticPrimed = false;
        }
    }

    protected synchronized void updateTriggerCacheFromReport(byte[] report) {
        if (report == null || report.length < REPORT_MIN_TRIGGER_LEN || report[0] != 0x02) {
            return;
        }

        cachedRightTriggerType = report[REPORT_RIGHT_TRIGGER_TYPE_IDX];
        System.arraycopy(report, REPORT_RIGHT_TRIGGER_DATA_IDX, cachedRightTriggerData, 0, TRIGGER_DATA_LEN);
        cachedLeftTriggerType = report[REPORT_LEFT_TRIGGER_TYPE_IDX];
        System.arraycopy(report, REPORT_LEFT_TRIGGER_DATA_IDX, cachedLeftTriggerData, 0, TRIGGER_DATA_LEN);
    }

    private boolean tryPrimeHaptics() {
        if (outEndpt == null) {
            return false;
        }

        byte[] initReport = new byte[HAPTIC_INIT_REPORT_SIZE];
        initReport[0] = 0x02;
        initReport[1] = 0x0C;
        initReport[2] = 0x40;
        synchronized (this) {
            initReport[REPORT_RIGHT_TRIGGER_TYPE_IDX] = cachedRightTriggerType;
            System.arraycopy(cachedRightTriggerData, 0, initReport, REPORT_RIGHT_TRIGGER_DATA_IDX, TRIGGER_DATA_LEN);
            initReport[REPORT_LEFT_TRIGGER_TYPE_IDX] = cachedLeftTriggerType;
            System.arraycopy(cachedLeftTriggerData, 0, initReport, REPORT_LEFT_TRIGGER_DATA_IDX, TRIGGER_DATA_LEN);
        }

        final int res = connection.bulkTransfer(outEndpt, initReport, initReport.length, HAPTIC_INIT_TIMEOUT_MS);
        if (res == initReport.length) {
            hapticPrimed = true;
            hapticPrimeRetryCount = 0;
            lastPrimeSuccessAtMs = SystemClock.uptimeMillis();
            return true;
        }

        hapticPrimeRetryCount++;
        if (hapticPrimeRetryCount == 1 || hapticPrimeRetryCount % 50 == 0) {
            Log.w(TAG, "触觉初始化包发送失败: res=" + res + ", retries=" + hapticPrimeRetryCount);
        }
        return false;
    }
}
