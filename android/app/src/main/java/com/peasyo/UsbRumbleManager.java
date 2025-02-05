package com.peasyo;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.util.Log;

public class UsbRumbleManager extends ReactContextBaseJavaModule {

    private static boolean bindUsbDevice = false;
    private static boolean hasValidUsbDevice = false;
    private static String usbController = "";

    public UsbRumbleManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "UsbRumbleManager";
    }

    @ReactMethod
    public void setBindUsbDevice(boolean value) {
        bindUsbDevice = value;
    }

    public static boolean getBindUsbDevice() {
        return bindUsbDevice;
    }

    public static void setHasValidUsbDevice(boolean value) {
        hasValidUsbDevice = value;
    }

    @ReactMethod(isBlockingSynchronousMethod=true)
    public boolean getHasValidUsbDevice() {
        return hasValidUsbDevice;
    }

    public static void setUsbController(String value) {
        usbController = value;
    }

    @ReactMethod(isBlockingSynchronousMethod=true)
    public String getUsbController() {
        return usbController;
    }


    @ReactMethod
    private void rumble(int lowFreqMotor, int highFreqMotor) {
        Log.d("UsbRumbleManager", "rumble");
        short _lowFreqMotor = (short) lowFreqMotor;
        short _highFreqMotor = (short) highFreqMotor;
        MainActivity mainActivity = (MainActivity) getCurrentActivity();
        if (mainActivity != null) {
            mainActivity.handleRumble(_lowFreqMotor, _highFreqMotor);
        }
    }

    @ReactMethod
    private void rumbleTriggers(int leftTrigger, int rightTrigger) {
        Log.d("UsbRumbleManager", "rumbleTrigger");
        short _leftTrigger = (short) leftTrigger;
        short _rightTrigger = (short) rightTrigger;
        MainActivity mainActivity = (MainActivity) getCurrentActivity();
        if (mainActivity != null) {
            mainActivity.handleRumbleTrigger(_leftTrigger, _rightTrigger);
        }
    }

    @ReactMethod
    private void sendCommand() {
        MainActivity mainActivity = (MainActivity) getCurrentActivity();
        if (mainActivity != null) {
            byte[] reportData = new byte[] {
                    0x02, // Report ID
                    (byte)0xff, // valid_flag0
                    (byte)0xf7, // valid_flag1
                    0x00, // right trigger rumble
                    0x00, // left trigger rumble
                    0x00, 0x00, 0x00, 0x00,
                    0x00,  // mute_button_led (0: mute LED off  | 1: mute LED on)
                    0x10, // power_save_control(mute led on  = 0x00, off = 0x10)
                    0x06,          // R2 trigger effect mode
                    (byte)0x0a, // R2 trigger effect parameter 1
                    (byte)0xff, // R2 trigger effect parameter 2
                    (byte)0x14, // R2 trigger effect parameter 3
                    0x00,       // R2 trigger effect parameter 4
                    0x00,       // R2 trigger effect parameter 5
                    0x00,       // R2 trigger effect parameter 6
                    0x00,       // R2 trigger effect parameter 7
                    0x00, 0x00, 0x00,
                    0x01,       // L2 trigger effect mode
                    0x28,       // L2 trigger effect parameter 1
                    (byte)0xE6, // L2 trigger effect parameter 2
                    0x00,       // L2 trigger effect parameter 3
                    0x00,       // L2 trigger effect parameter 4
                    0x00,       // L2 trigger effect parameter 5
                    0x00,       // L2 trigger effect parameter 6
                    0x00,       // L2 trigger effect parameter 7
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x02, 0x00, 0x02, 0x00,
                    0x00,       // player leds
                    (byte)0x12, (byte)0xff, (byte)0x1c // RGB values
            };
            mainActivity.handleSendCommand(reportData);
        }
    }
}