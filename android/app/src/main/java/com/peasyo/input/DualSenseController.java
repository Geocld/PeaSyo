package com.peasyo.input;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.util.Log;

import java.nio.ByteBuffer;

public class DualSenseController extends AbstractDualSenseController {
    private static final int[] SUPPORTED_VENDORS = {
            0x054C,
            0x0CE6,
            0x0DF2,
    };

    public static boolean canClaimDevice(UsbDevice device) {
        for (int supportedVid : SUPPORTED_VENDORS) {
            if (device.getVendorId() == supportedVid &&
                    device.getInterfaceCount() >= 1
            ) {
                return true;
            }
        }

        return false;
    }

    public DualSenseController(UsbDevice device, UsbDeviceConnection connection, int deviceId, UsbDriverListener listener) {
        super(device, connection, deviceId, listener);
    }

    @Override
    protected boolean handleRead(ByteBuffer buffer) {
//        Log.d("UsbDriverService", "dualsenseController.java handleRead: " + buffer);
        if (buffer.remaining() < 14) {
            Log.d("UsbDriverService DualController.java", "Read too small: "+buffer.remaining());
            return false;
        }

        // Skip first short
        buffer.position(buffer.position() + 2);
        byte b = buffer.get();
//        Log.d("UsbDriverService", "dualsenseController.java handleRead buffer: " + b);
        return false;
    }

    public static class OutputState {
        public int motorRight = 0;
        public int motorLeft = 0;
        public boolean micLight = false;
        public TriggerEffect leftTriggerEffect = TriggerEffect.OFF;
        public TriggerEffect rightTriggerEffect = TriggerEffect.OFF;
        public byte[] leftTriggerEffectData = new byte[8];
        public byte[] rightTriggerEffectData = new byte[8];
        public int playerLight = 0;
        public int playerLightBrightness = 0;
        public byte[] lightbar = new byte[3];
    }

    public enum TriggerEffect {
        OFF,
        CONTINUOUS,
        SECTION,
        EFFECT_A,
        EFFECT_B,
        EFFECT_C,
        CALIBRATION
    }

    private boolean sendLedCommand() {
        Log.d("UsbDriverService DualController.java", "sendLedCommand");

        byte[] reportData = new byte[] {
                0x02, // Report ID
                (byte)0xff, // valid_flag0
                (byte)0xf7, // valid_flag1
                0x00, // right trigger rumble
                0x00, // left trigger rumble
                0x00, 0x00, 0x00, 0x00,
                0x00,  // mute_button_led (0: mute LED off  | 1: mute LED on)
                0x10, // power_save_control(mute led on  = 0x00, off = 0x10)
                0x26, // R2 trigger effect mode
                (byte)0x90, // R2 trigger effect parameter 1
                (byte)0xa0, // R2 trigger effect parameter 2
                (byte)0xff, // R2 trigger effect parameter 3
                0x00,
                0x00,
                0x00, 0x00,
                0x00, 0x00, 0x00,
                0x26, // L2 trigger effect mode
                (byte)0x90, // L2 trigger effect parameter 1
                (byte)0xa0, // L2 trigger effect parameter 2
                (byte)0xff, // L2 trigger effect parameter 3
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x02, 0x00, 0x02, 0x00,
                0x00, // player leds
                (byte)0xff, (byte)0xff, (byte)0xff // RGB values
        };

        int res = connection.bulkTransfer(outEndpt, reportData, reportData.length, 3000);
        Log.e("UsbDriverService Xbox360Controller.java", "Transfer result: " + res);
        if (res != reportData.length) {
            Log.d("UsbDriverService Xbox360Controller.java", "LED set transfer failed: " + res);
            return false;
        }

        return true;
    }

    @Override
    protected boolean doInit() {
        Log.d("UsbDriverService", "dualsenseController.java doInit");
        return true;
    }

    @Override
    public void rumble(short lowFreqMotor, short highFreqMotor) {
        sendLedCommand();
//        byte[] data = {
//                0x00, 0x08, 0x00,
//                (byte)(lowFreqMotor >> 8), (byte)(highFreqMotor >> 8),
//                0x00, 0x00, 0x00
//        };
//        int res = connection.bulkTransfer(outEndpt, data, data.length, 100);
//        if (res != data.length) {
//            Log.d("UsbDriverService Xbox360Controller.java", "Rumble transfer failed: "+res);
//        }
    }

    @Override
    public void rumbleTriggers(short leftTrigger, short rightTrigger) {
        // Trigger motors not present on Xbox 360 controllers
    }
}
