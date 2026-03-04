package com.peasyo.audio;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;

import java.util.Locale;

public final class AudioRouteResolver {
    private static final String TAG = "AudioRouteResolver";

    public static final int DEVICE_ID_UNSPECIFIED = -1;

    public static final String MODE_AUTO = "AUTO";
    public static final String MODE_STANDARD = "STANDARD";
    public static final String MODE_SPEAKER = "SPEAKER";
    public static final String MODE_WIRED = "WIRED";
    public static final String MODE_BLUETOOTH = "BLUETOOTH";
    public static final String MODE_USB = "USB";
    public static final String MODE_HDMI = "HDMI";

    private AudioRouteResolver() {}

    public static int resolveOutputDeviceId(
            Context context,
            String mode,
            boolean usbMode,
            String usbController
    ) {
        if (context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return DEVICE_ID_UNSPECIFIED;
        }

        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) {
            return DEVICE_ID_UNSPECIFIED;
        }

        AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
        if (devices == null || devices.length == 0) {
            return DEVICE_ID_UNSPECIFIED;
        }

        String normalizedMode = normalizeMode(mode);
        if (MODE_STANDARD.equals(normalizedMode)) {
            return DEVICE_ID_UNSPECIFIED;
        }

        int selectedDeviceId = MODE_AUTO.equals(normalizedMode)
                ? pickAutoDevice(devices, usbMode, usbController)
                : pickByMode(devices, normalizedMode, usbMode, usbController);

        if (selectedDeviceId == DEVICE_ID_UNSPECIFIED && MODE_AUTO.equals(normalizedMode)) {
            selectedDeviceId = pickFallbackDevice(devices, usbMode, usbController);
        }

        Log.i(TAG, "Resolved route mode=" + normalizedMode + " deviceId=" + selectedDeviceId);
        return selectedDeviceId;
    }

    private static String normalizeMode(String mode) {
        if (mode == null || mode.trim().isEmpty()) {
            return MODE_AUTO;
        }
        return mode.trim().toUpperCase(Locale.US);
    }

    private static int pickByMode(
            AudioDeviceInfo[] devices,
            String mode,
            boolean usbMode,
            String usbController
    ) {
        switch (mode) {
            case MODE_SPEAKER:
                return findFirst(devices, AudioRouteResolver::isSpeakerType, usbMode, usbController, false);
            case MODE_WIRED:
                return findFirst(devices, AudioRouteResolver::isWiredType, usbMode, usbController, false);
            case MODE_BLUETOOTH:
                return findFirst(devices, AudioRouteResolver::isBluetoothType, usbMode, usbController, false);
            case MODE_USB: {
                int id = findFirst(devices, AudioRouteResolver::isUsbType, usbMode, usbController, false);
                if (id != DEVICE_ID_UNSPECIFIED) {
                    return id;
                }
                return findFirst(devices, AudioRouteResolver::isUsbType, usbMode, usbController, true);
            }
            case MODE_HDMI:
                return findFirst(devices, AudioRouteResolver::isHdmiType, usbMode, usbController, false);
            default:
                return DEVICE_ID_UNSPECIFIED;
        }
    }

    private static int pickAutoDevice(
            AudioDeviceInfo[] devices,
            boolean usbMode,
            String usbController
    ) {
        int id;

        id = findFirst(devices, AudioRouteResolver::isHdmiType, usbMode, usbController, false);
        if (id != DEVICE_ID_UNSPECIFIED) {
            return id;
        }

        id = findFirst(devices, AudioRouteResolver::isWiredType, usbMode, usbController, false);
        if (id != DEVICE_ID_UNSPECIFIED) {
            return id;
        }

        id = findFirst(devices, AudioRouteResolver::isBluetoothType, usbMode, usbController, false);
        if (id != DEVICE_ID_UNSPECIFIED) {
            return id;
        }

        id = findFirst(devices, AudioRouteResolver::isUsbType, usbMode, usbController, false);
        if (id != DEVICE_ID_UNSPECIFIED) {
            return id;
        }

        id = findFirst(devices, AudioRouteResolver::isSpeakerType, usbMode, usbController, false);
        if (id != DEVICE_ID_UNSPECIFIED) {
            return id;
        }

        return DEVICE_ID_UNSPECIFIED;
    }

    private static int pickFallbackDevice(
            AudioDeviceInfo[] devices,
            boolean usbMode,
            String usbController
    ) {
        int id = findFirst(devices, device -> true, usbMode, usbController, false);
        if (id != DEVICE_ID_UNSPECIFIED) {
            return id;
        }
        return devices[0].getId();
    }

    private static int findFirst(
            AudioDeviceInfo[] devices,
            DeviceMatcher matcher,
            boolean usbMode,
            String usbController,
            boolean includeControllerVirtualAudio
    ) {
        for (AudioDeviceInfo device : devices) {
            if (device == null || !matcher.matches(device)) {
                continue;
            }
            if (!includeControllerVirtualAudio
                    && isLikelyControllerVirtualAudio(device, usbMode, usbController)) {
                continue;
            }
            return device.getId();
        }
        return DEVICE_ID_UNSPECIFIED;
    }

    private static boolean isLikelyControllerVirtualAudio(
            AudioDeviceInfo device,
            boolean usbMode,
            String usbController
    ) {
        if (!isUsbType(device)) {
            return false;
        }

        String product = "";
        CharSequence productName = device.getProductName();
        if (productName != null) {
            product = productName.toString().toLowerCase(Locale.US);
        }

        if (containsAny(product,
                "controller",
                "wireless controller",
                "dualsense",
                "dualshock",
                "xbox",
                "gamepad",
                "joystick",
                "ps5",
                "ps4")) {
            return true;
        }

        if (usbMode && usbController != null) {
            String normalizedController = usbController
                    .toLowerCase(Locale.US)
                    .replace("controller", "")
                    .trim();
            if (!normalizedController.isEmpty() && product.contains(normalizedController)) {
                return true;
            }
        }

        return false;
    }

    private static boolean containsAny(String value, String... keywords) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isSpeakerType(AudioDeviceInfo device) {
        int type = device.getType();
        return type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER;
    }

    private static boolean isWiredType(AudioDeviceInfo device) {
        int type = device.getType();
        return type == AudioDeviceInfo.TYPE_WIRED_HEADSET
                || type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES
                || type == AudioDeviceInfo.TYPE_LINE_ANALOG
                || type == AudioDeviceInfo.TYPE_LINE_DIGITAL;
    }

    private static boolean isBluetoothType(AudioDeviceInfo device) {
        int type = device.getType();
        if (type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP
                || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
            return true;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return type == AudioDeviceInfo.TYPE_BLE_HEADSET
                    || type == AudioDeviceInfo.TYPE_BLE_SPEAKER
                    || type == AudioDeviceInfo.TYPE_BLE_BROADCAST;
        }

        return false;
    }

    private static boolean isUsbType(AudioDeviceInfo device) {
        int type = device.getType();
        return type == AudioDeviceInfo.TYPE_USB_DEVICE
                || type == AudioDeviceInfo.TYPE_USB_ACCESSORY
                || type == AudioDeviceInfo.TYPE_USB_HEADSET;
    }

    private static boolean isHdmiType(AudioDeviceInfo device) {
        int type = device.getType();
        return type == AudioDeviceInfo.TYPE_HDMI
                || type == AudioDeviceInfo.TYPE_HDMI_ARC
                || type == AudioDeviceInfo.TYPE_HDMI_EARC;
    }

    private interface DeviceMatcher {
        boolean matches(AudioDeviceInfo device);
    }
}
