package com.peasyo.stream;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewGroupManager;
import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;
import com.peasyo.lib.*;

public class StreamViewManager extends SimpleViewManager<StreamView> {
    public static final String REACT_CLASS = "StreamView";

    public static final int COMMAND_START_SESSION = 1;
    public static final int COMMAND_STOP_SESSION = 2;
    public static final int COMMAND_FOCUS = 3;
    public static final int COMMAND_PRESS_BUTTON = 4;
    public static final int COMMAND_PRESS_TRIGGER = 5;
    public static final int COMMAND_MOVE_STICK = 6;
    public static final int COMMAND_TOUCHPAD = 7;
    public static final int COMMAND_TOUCHPAD_TAP = 8;
    public static final int COMMAND_PERFORMANCE = 9;
    public static final int COMMAND_USB_CONTROLLER = 10;
    public static final int COMMAND_GOTO_BED = 11;
    public static final int COMMAND_START_SENSOR = 12;
    public static final int COMMAND_STOP_SENSOR = 13;
    public static final int COMMAND_USB_DS_CONTROLLER = 14;

    public static final int COMMAND_SENSOR_STICK = 15;
    public static final int COMMAND_SEND_TEXT = 16;
    public static final int COMMAND_KEYBOARD_SWITCH = 17;
    public static final int COMMAND_SET_LOGIN_PIN = 18;

    @Override
    @NonNull
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    @NonNull
    protected StreamView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new StreamView(reactContext);
    }

    @ReactProp(name = "streamInfo")
    public void setStreamInfo(StreamView view, ReadableMap streamInfo) {
        boolean ps5 = streamInfo.getBoolean("ps5");
        String host = streamInfo.getString("host");
        String parsedHost = streamInfo.getString("parsedHost");
        String registKeyBase64 = streamInfo.getString("registKey"); // base64
        String morningBase64 = streamInfo.getString("morning"); // base64
        String psnAccountIdBase64 = streamInfo.getString("psnAccountId");
        String accessToken = streamInfo.getString("accessToken");
        String nickName = streamInfo.getString("nickName");
        boolean enableKeyboard = streamInfo.getBoolean("enableKeyboard");

        byte[] registKey = java.util.Base64.getDecoder().decode(registKeyBase64);
        byte[] morning = java.util.Base64.getDecoder().decode(morningBase64);
        byte[] psnAccountId = java.util.Base64.getDecoder().decode(psnAccountIdBase64);

        int width = streamInfo.getInt("width");
        int height = streamInfo.getInt("height");
        int fps = streamInfo.getInt("fps");
        int bitrate = streamInfo.getInt("bitrate");

        Codec codec = Codec.CODEC_H265;
        String streamCodec = streamInfo.getString("codec");
        int maxOperatingRate = streamInfo.getInt("maxOperatingRate");
        if (streamCodec != null) {
            switch (streamCodec) {
                case "H264":
                    codec = Codec.CODEC_H264;
                    break;
                case "H265-HDR":
                    codec = Codec.CODEC_H265_HDR;
                    break;
                default:
                    break;
            }
        }
        ConnectVideoProfile videoProfile = new ConnectVideoProfile(
                width,           // width
                height,            // height
                fps,             // maxFPS
                bitrate,        // bitrate
                codec,  // codec
                maxOperatingRate

        );

        ConnectInfo connectInfo = new ConnectInfo(ps5, host, parsedHost, registKey, morning, videoProfile, enableKeyboard, psnAccountId, accessToken, nickName);
        view.setConnectInfo(connectInfo, streamInfo);
    }

    // Receive method from js
    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        Log.d("StreamView", "View manager getCommandsMap:");
        return MapBuilder.<String, Integer>builder()
                .put("startSession", COMMAND_START_SESSION)
                .put("stopSession", COMMAND_STOP_SESSION)
                .put("pressButton", COMMAND_PRESS_BUTTON)
                .put("pressTrigger", COMMAND_PRESS_TRIGGER)
                .put("moveStick", COMMAND_MOVE_STICK)
                .put("sensorStick", COMMAND_SENSOR_STICK)
                .put("touchpad", COMMAND_TOUCHPAD)
                .put("touchpadTap", COMMAND_TOUCHPAD_TAP)
                .put("performance", COMMAND_PERFORMANCE)
                .put("usbController", COMMAND_USB_CONTROLLER)
                .put("usbDsController", COMMAND_USB_DS_CONTROLLER)
                .put("requestFocus", COMMAND_FOCUS)
                .put("gotoBed", COMMAND_GOTO_BED)
                .put("startSensor", COMMAND_START_SENSOR)
                .put("stopSensor", COMMAND_STOP_SENSOR)
                .put("sendText", COMMAND_SEND_TEXT)
                .put("keyboardSwitch", COMMAND_KEYBOARD_SWITCH)
                .put("setLoginPin", COMMAND_SET_LOGIN_PIN)
                .build();
    }

    @Override
    public void receiveCommand(
            StreamView view,
            String commandId,
            @Nullable ReadableArray args) {
        int commandIdInt = Integer.parseInt(commandId);
        switch (commandIdInt) {
            case COMMAND_START_SESSION: {
                view.startSession();
                break;
            }
            case COMMAND_STOP_SESSION: {
                view.stopSession();
                break;
            }
            case COMMAND_PRESS_BUTTON: {
                if (args != null) {
                    int buttonMask = args.getInt(0);
                    boolean isPressed = args.getBoolean(1);
                    view.handleVirtualButton(buttonMask, isPressed);
                }
                break;
            }
            case COMMAND_PRESS_TRIGGER: {
                if (args != null) {
                    String name = args.getString(0);
                    double value = args.getDouble(1);
                    view.handleVirtualTriggerButton(name, (float) value);
                }
                break;
            }
            case COMMAND_MOVE_STICK: {
                if (args != null) {
                    String name = args.getString(0);
                    double x = args.getDouble(1);
                    double y = args.getDouble(2);
                    view.handleVirtualStick(name, (float) x, (float) y);
                }
                break;
            }
            case COMMAND_SENSOR_STICK: {
                if (args != null) {
                    double x = args.getDouble(0);
                    double y = args.getDouble(1);
                    view.handleSensorStick((float) x, (float) y);
                }
                break;
            }
            case COMMAND_TOUCHPAD: {
                if (args != null) {
                    double mask = args.getDouble(0);
                    double nextId = args.getDouble(1);
                    double x1 = args.getDouble(2);
                    double y1 = args.getDouble(3);
                    double id1 = args.getDouble(4);
                    double x2 = args.getDouble(5);
                    double y2 = args.getDouble(6);
                    double id2 = args.getDouble(7);

                    ControllerTouch[] touches = new ControllerTouch[] {
                            new ControllerTouch((short)x1, (short)y1, (byte)id1),
                            new ControllerTouch((short)x2, (short)y2, (byte)id2)
                    };
                    view.handleTouchpad((int)mask, (byte)nextId, touches);
                }
                break;
            }

            case COMMAND_TOUCHPAD_TAP: {
                if (args != null) {
                    boolean isPressed = args.getBoolean(0);
                    double nextId = args.getDouble(1);
                    double x1 = args.getDouble(2);
                    double y1 = args.getDouble(3);
                    double id1 = args.getDouble(4);
                    double x2 = args.getDouble(5);
                    double y2 = args.getDouble(6);
                    double id2 = args.getDouble(7);

                    ControllerTouch[] touches = new ControllerTouch[] {
                            new ControllerTouch((short)x1, (short)y1, (byte)id1),
                            new ControllerTouch((short)x2, (short)y2, (byte)id2)
                    };
                    view.handleTouchpadTap(isPressed, (byte)nextId, touches);
                }
                break;
            }

            case COMMAND_PERFORMANCE: {
                view.handleGetPerformance();
                break;
            }

            case COMMAND_USB_CONTROLLER: {
                if (args != null) {
                    int flags = args.getInt(0);
                    double leftStickX = args.getDouble(1);
                    double leftStickY = args.getDouble(2);
                    double rightStickX = args.getDouble(3);
                    double rightStickY = args.getDouble(4);
                    double leftTrigger = args.getDouble(5);
                    double rightTrigger = args.getDouble(6);
                    view.handleUsbControllerEvent(flags, (float) leftStickX, (float) leftStickY, (float) rightStickX, (float) rightStickY, (float) leftTrigger, (float) rightTrigger);
                }

                break;
            }

            case COMMAND_USB_DS_CONTROLLER: {
                if (args != null) {
                    int flags = args.getInt(0);
                    double leftStickX = args.getDouble(1);
                    double leftStickY = args.getDouble(2);
                    double rightStickX = args.getDouble(3);
                    double rightStickY = args.getDouble(4);
                    double leftTrigger = args.getDouble(5);
                    double rightTrigger = args.getDouble(6);
                    double gyrox = args.getDouble(7);
                    double gyroy = args.getDouble(8);
                    double gyroz = args.getDouble(9);
                    double accelx = args.getDouble(10);
                    double accely = args.getDouble(11);
                    double accelz = args.getDouble(12);
                    int touch0id = args.getInt(13);
                    int touch0x = args.getInt(14);
                    int touch0y = args.getInt(15);
                    int touch1id = args.getInt(16);
                    int touch1x = args.getInt(17);
                    int touch1y = args.getInt(18);

                    view.handleUsbDsControllerEvent(
                            flags,
                            (float) leftStickX,
                            (float) leftStickY,
                            (float) rightStickX,
                            (float) rightStickY,
                            (float) leftTrigger,
                            (float) rightTrigger,
                            (float) gyrox,
                            (float) gyroy,
                            (float) gyroz,
                            (float) accelx,
                            (float) accely,
                            (float) accelz,
                            touch0id,
                            touch0x,
                            touch0y,
                            touch1id,
                            touch1x,
                            touch1y
                    );
                }

                break;
            }

            case COMMAND_FOCUS: {
                view.requestFocus();
                break;
            }

            case COMMAND_GOTO_BED: {
                view.sleep();
                break;
            }

            case COMMAND_START_SENSOR: {
                view.startSensorListener();
                break;
            }

            case COMMAND_STOP_SENSOR: {
                view.stopSensorListener();
                break;
            }

            case COMMAND_SEND_TEXT: {
                if (args != null) {
                    String text = args.getString(0);
                    view.sendText(text);
                }
                break;
            }

            case COMMAND_KEYBOARD_SWITCH: {
                if (args != null) {
                    boolean isReject = args.getBoolean(0);
                    if (isReject) {
                        view.keyboardReject();
                    } else {
                        view.keyboardAccept();
                    }
                }
            }

            case COMMAND_SET_LOGIN_PIN: {
                if (args != null) {
                    String pin = args.getString(0);
                    view.setLoginPin(pin);
                }
                break;
            }

            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %s received by %s.",
                        commandId,
                        getClass().getSimpleName()));
        }
    }


}
