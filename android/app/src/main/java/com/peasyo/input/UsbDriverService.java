package com.peasyo.input;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;
import android.view.InputDevice;
import android.widget.Toast;

import com.peasyo.UsbRumbleManager;

import java.io.File;
import java.util.ArrayList;

public class UsbDriverService extends Service implements UsbDriverListener {
    private static final String ACTION_USB_PERMISSION =
            "com.peasyo.USB_PERMISSION";
    private static final long ATTACH_DELAY_MS = 1000L;
    private UsbManager usbManager;
    private boolean started;

    private final UsbEventReceiver receiver = new UsbEventReceiver();
    private final UsbDriverBinder binder = new UsbDriverBinder();

    private final ArrayList<AbstractController> controllers = new ArrayList<>();

    private UsbDriverListener listener;
    private UsbDriverStateListener stateListener;
    private int nextDeviceId;

    @Override
    public void reportControllerState(int controllerId, int buttonFlags, float leftStickX, float leftStickY,
                                      float rightStickX, float rightStickY, float leftTrigger, float rightTrigger) {
        // 透传给上层监听器
        if (listener != null) {
            listener.reportControllerState(controllerId, buttonFlags, leftStickX, leftStickY, rightStickX, rightStickY, leftTrigger, rightTrigger);
        }
    }

    @Override
    public void reportDsControllerState(int controllerId, int buttonFlags, float leftStickX, float leftStickY,
                                      float rightStickX, float rightStickY, float leftTrigger, float rightTrigger,
                                        int gyrox, int gyroy, int gyroz, int accelx, int accely, int accelz,
                                        boolean touch0active, boolean touch1active,
                                        int touch0id, int touch0x, int touch0y,
                                        int touch1id, int touch1x, int touch1y) {
        // 透传给上层监听器
        if (listener != null) {
            listener.reportDsControllerState(controllerId, buttonFlags, leftStickX, leftStickY, rightStickX, rightStickY, leftTrigger, rightTrigger,
                    gyrox, gyroy, gyroz, accelx, accely, accelz,
                    touch0active, touch1active,
                    touch0id, touch0x, touch0y,
                    touch1id, touch1x, touch1y);
        }
    }

    @Override
    public void deviceRemoved(AbstractController controller) {
        Log.d("UsbDriverService", "deviceRemoved");
        // 从列表中移除该控制器（若尚未移除）
        controllers.remove(controller);

        // 透传给上层监听器
        if (listener != null) {
            listener.deviceRemoved(controller);
            UsbRumbleManager.setHasValidUsbDevice(false);
        }
    }

    @Override
    public void deviceAdded(AbstractController controller) {
        Log.d("UsbDriverService", "deviceAdded");
        // 透传给上层监听器
        if (listener != null) {
            listener.deviceAdded(controller);
            UsbRumbleManager.setHasValidUsbDevice(true);
        }
    }

    public class UsbEventReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();

            // 设备首次插入广播
            if (action.equals(UsbManager.ACTION_USB_DEVICE_ATTACHED)) {
                final UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);

                final boolean bindAllUsb = UsbRumbleManager.getBindUsbDevice();
                if (bindAllUsb) {
                    // 覆盖模式优先响应速度，对齐 native gamepad 的行为。
                    handleUsbDeviceState(device);
                } else {
                    // shouldClaimDevice() 依赖内核已枚举出的输入设备来决定是否接管。
                    // 内核输入栈初始化与该回调存在竞态，若过早判断，可能在系统已可正常驱动
                    // 设备时仍误触发接管。这里延迟处理一次，给内核输入栈留出就绪时间。
                    // 该延迟仅在未开启覆盖模式时生效。
                    // 处理延迟完成后继续状态机。
                    // 这里使用延迟消息触发后续流程。
                    // 以降低与系统输入设备枚举的竞态风险。
                    new Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            // 继续状态机流程
                            handleUsbDeviceState(device);
                        }
                    }, ATTACH_DELAY_MS);
                }
            }
            // 权限弹窗结束后的回调
            else if (action.equals(ACTION_USB_PERMISSION)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);

                // 权限弹窗已关闭
                if (stateListener != null) {
                    stateListener.onUsbPermissionPromptCompleted();
                }

                // 走到这里说明该设备类型我们可处理，授权通过后继续状态机
                if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                    handleUsbDeviceState(device);
                }
            }
        }
    }

    public class UsbDriverBinder extends Binder {
        public void setListener(UsbDriverListener listener) {
            UsbDriverService.this.listener = listener;

            // 回放当前已存在的控制器
            if (listener != null) {
                for (AbstractController controller : controllers) {
                    listener.deviceAdded(controller);
                }
            }
        }

        public void setStateListener(UsbDriverStateListener stateListener) {
            UsbDriverService.this.stateListener = stateListener;
        }

        public void start() {
            UsbDriverService.this.start();
        }

        public void stop() {
            UsbDriverService.this.stop();
        }
    }

    private void handleUsbDeviceState(UsbDevice device) {
        // 判断当前设备是否可由我们接管

        // 读取覆盖安卓手柄支持开关
        boolean bindAllUsb = UsbRumbleManager.getBindUsbDevice();
        Log.d("UsbDriverService", "bindAllUsb: " + bindAllUsb);

        Log.d("UsbDriverService", "shouldClaimDevice: " + shouldClaimDevice(device, bindAllUsb));
        if (shouldClaimDevice(device, bindAllUsb)) {
            // 当前是否已具备 USB 访问权限
            if (!usbManager.hasPermission(device)) {
                // 触发系统 USB 授权弹窗
                try {
                    // 通知状态监听器：即将展示权限弹窗
                    if (stateListener != null) {
                        stateListener.onUsbPermissionPromptStarting();
                    }

                    int intentFlags = 0;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        // 该 PendingIntent 需要可变，系统才能填充 EXTRA_DEVICE 和 EXTRA_PERMISSION_GRANTED。
                        intentFlags |= PendingIntent.FLAG_MUTABLE;
                    }

                    // 按文档该调用通常不会抛异常（拒绝授权会通过 PendingIntent 返回 false）。
                    // 但在部分 Samsung Knox 策略下会直接抛出未文档化的 SecurityException，
                    // 导致应用崩溃，因此这里做兜底捕获。
                    // 该异常并不会以标准授权失败回调返回。
                    // 所以需要主动捕获以保证流程可恢复。
                    // 避免整应用崩溃。

                    // Android 14+ 需要显式 Intent 才能触发未导出的广播接收器。
                    Intent i = new Intent(ACTION_USB_PERMISSION);
                    i.setPackage(getPackageName());

                    usbManager.requestPermission(device, PendingIntent.getBroadcast(UsbDriverService.this, 0, i, intentFlags));
                } catch (SecurityException e) {
                    Log.d("UsbDriverService", "handleUsbDeviceState error：" + e);
                    if (stateListener != null) {
                        stateListener.onUsbPermissionPromptCompleted();
                    }
                }
                return;
            }

            // 打开 USB 设备
            UsbDeviceConnection connection = usbManager.openDevice(device);
            if (connection == null) {
                Log.d("UsbDriverService", "Unable to open USB device: "+device.getDeviceName());
                return;
            }


            AbstractController controller;

            if (XboxOneController.canClaimDevice(device)) {
                Log.d("UsbDriverService", "XboxOneController");
                UsbRumbleManager.setUsbController("XboxOneController");
                controller = new XboxOneController(device, connection, nextDeviceId++, this);
            }
            else if (Xbox360Controller.canClaimDevice(device)) {
                Log.d("UsbDriverService", "Xbox360Controller");
                UsbRumbleManager.setUsbController("Xbox360Controller");
                controller = new Xbox360Controller(device, connection, nextDeviceId++, this);
            }
            else if (Xbox360WirelessDongle.canClaimDevice(device)) {
                Log.d("UsbDriverService", "Xbox360WirelessDongle");
                UsbRumbleManager.setUsbController("Xbox360WirelessDongle");
                controller = new Xbox360WirelessDongle(device, connection, nextDeviceId++, this);
            }
            else if (DualSenseController.canClaimDevice(device)) {
                Log.d("UsbDriverService", "DualSenseController");
                UsbRumbleManager.setUsbController("DualSenseController");
                controller = new DualSenseController(device, connection, nextDeviceId++, this);
            }
            else {
                // 理论不可达
                return;
            }

            // 启动控制器
            if (!controller.start()) {
                connection.close();
                return;
            }

            // 记录到已接管控制器列表
            UsbRumbleManager.setHasValidUsbDevice(true);
            controllers.add(controller);
        }
    }

    public static boolean isRecognizedInputDevice(UsbDevice device) {
        // 判断该 VID/PID 是否已被系统识别为输入设备；
        // 若已识别，则优先交给系统内置驱动处理。
        for (int id : InputDevice.getDeviceIds()) {
            InputDevice inputDev = InputDevice.getDevice(id);
            if (inputDev == null) {
                // 遍历过程中设备被移除
                continue;
            }

            if (inputDev.getVendorId() == device.getVendorId() &&
                    inputDev.getProductId() == device.getProductId()) {
                return true;
            }
        }

        return false;
    }

    public static boolean kernelSupportsXboxOne() {
        String kernelVersion = System.getProperty("os.version");
        Log.d("UsbDriverService", "Kernel Version: " + kernelVersion);

        if (kernelVersion == null) {
            // 读取不到内核版本时，按较新系统处理。
            // 该情况下默认认为具备较新内核能力。
            return true;
        }
        else if (kernelVersion.startsWith("2.") || kernelVersion.startsWith("3.")) {
            // 旧内核基本不具备完整的 Xbox One 支持。
            return false;
        }
        else if (kernelVersion.startsWith("4.4.") || kernelVersion.startsWith("4.9.")) {
            // 该区间内核不保证已回移 Xbox One 相关补丁（少数机型例外）。
            // 因此这里按不支持处理。
            return false;
        }
        else {
            // 后续 AOSP 公共内核（如 4.14+）通常具备可用的 Xbox One 支持。
            return true;
        }
    }

    public static boolean kernelSupportsXbox360W() {
        // 检查内核是否至少 4.2+，用于判断 xpad 是否会设置 Xbox 360 无线 LED。
        // https://github.com/torvalds/linux/commit/75b7f05d2798ee3a1cc5bbdd54acd0e318a80396
        String kernelVersion = System.getProperty("os.version");
        if (kernelVersion != null) {
            if (kernelVersion.startsWith("2.") || kernelVersion.startsWith("3.") ||
                    kernelVersion.startsWith("4.0.") || kernelVersion.startsWith("4.1.")) {
                // 即使存在 LED 设备节点，驱动也不会设置初始 LED 状态。
                return false;
            }
        }

        // 这里基本可判断内核应支持 Xbox 360 无线 LED，但仍无法确认
        // CONFIG_JOYSTICK_XPAD_LEDS 是否在内核编译时开启。
        // 受 Android 沙箱限制，应用无法可靠检测该编译配置。
        // 读取 /proc/config.gz 或枚举 /sys/class/leds 往往会被 SELinux 阻止。
        // 这里默认这些内核已启用该能力，
        // 用户可通过覆盖安卓手柄支持强制应用接管。
        return true;
    }

    public static boolean shouldClaimDevice(UsbDevice device, boolean claimAllAvailable) {
        Log.d("UsbDriverService", "UsbDevice info: "+device.toString());
        return ((!kernelSupportsXboxOne() || !isRecognizedInputDevice(device) || claimAllAvailable) && XboxOneController.canClaimDevice(device)) ||
                ((!isRecognizedInputDevice(device) || claimAllAvailable) && Xbox360Controller.canClaimDevice(device)) ||
                // 无线控制器与接收器 PID 不同，这里不能依赖 isRecognizedInputDevice() 判断。
                ((!kernelSupportsXbox360W() || claimAllAvailable) && Xbox360WirelessDongle.canClaimDevice(device)) ||
                (DualSenseController.canClaimDevice((device)) && claimAllAvailable);
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private void start() {
        if (started || usbManager == null) {
            return;
        }

        started = true;

        // 注册 USB 插入与权限回调广播
        IntentFilter filter = new IntentFilter();
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, filter, RECEIVER_NOT_EXPORTED);
        }
        else {
            registerReceiver(receiver, filter);
        }

        // 读取覆盖安卓手柄支持开关
        boolean bindAllUsb = UsbRumbleManager.getBindUsbDevice();

        // 枚举当前已连接设备
        for (UsbDevice dev : usbManager.getDeviceList().values()) {
            Log.d("UsbDriverService", "shouldClaimDevice2: " + shouldClaimDevice(dev, bindAllUsb));
            if (shouldClaimDevice(dev, bindAllUsb)) {
                // 启动该设备的接管流程
                handleUsbDeviceState(dev);
            }
        }
    }

    private void stop() {
        if (!started) {
            return;
        }

        started = false;

        // 停止插入事件接收器
        unregisterReceiver(receiver);

        // 停止并清理所有控制器
        while (controllers.size() > 0) {
            // 停止并移除控制器
            controllers.remove(0).stop();
        }
    }

    @Override
    public void onCreate() {
        Log.d("UsbDriverService", "UsbDriverService onCreate");
        this.usbManager = (UsbManager) getSystemService(Context.USB_SERVICE);
//        this.prefConfig = PreferenceConfiguration.readPreferences(this);
    }

    @Override
    public void onDestroy() {
        stop();

        // 清理监听器
        listener = null;
        stateListener = null;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    public interface UsbDriverStateListener {
        void onUsbPermissionPromptStarting();
        void onUsbPermissionPromptCompleted();
    }
}

