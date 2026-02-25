package com.peasyo.stream;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.media3.common.util.UnstableApi;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.peasyo.lib.Codec;
import com.peasyo.lib.ConnectInfo;
import com.peasyo.lib.ConnectVideoProfile;
import com.peasyo.lib.ControllerTouch;

import java.util.Map;

import javax.annotation.Nullable;
@UnstableApi
public class StreamFsrViewManager extends SimpleViewManager<StreamFsrView> {

    public static final String REACT_CLASS = "StreamFsrView";

    private static final int COMMAND_START_SESSION = 1;
    private static final int COMMAND_STOP_SESSION = 2;
    private static final int COMMAND_FOCUS = 3;
    private static final int COMMAND_PRESS_BUTTON = 4;
    private static final int COMMAND_PRESS_TRIGGER = 5;
    private static final int COMMAND_MOVE_STICK = 6;
    private static final int COMMAND_TOUCHPAD = 7;
    private static final int COMMAND_TOUCHPAD_TAP = 8;
    private static final int COMMAND_PERFORMANCE = 9;
    private static final int COMMAND_USB_CONTROLLER = 10;
    private static final int COMMAND_GOTO_BED = 11;
    private static final int COMMAND_START_SENSOR = 12;
    private static final int COMMAND_STOP_SENSOR = 13;
    private static final int COMMAND_USB_DS_CONTROLLER = 14;
    private static final int COMMAND_SENSOR_STICK = 15;
    private static final int COMMAND_SEND_TEXT = 16;
    private static final int COMMAND_KEYBOARD_SWITCH = 17;
    private static final int COMMAND_SET_LOGIN_PIN = 18;

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected StreamFsrView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new StreamFsrView(reactContext);
    }

    @ReactProp(name = "streamInfo")
    public void setStreamInfo(StreamFsrView view, ReadableMap streamInfo) {
        boolean ps5 = streamInfo.getBoolean("ps5");
        String host = streamInfo.getString("host");
        String parsedHost = streamInfo.getString("parsedHost");
        String registKeyBase64 = streamInfo.getString("registKey");
        String morningBase64 = streamInfo.getString("morning");
        boolean enableKeyboard = streamInfo.getBoolean("enableKeyboard");
        String psnAccountIdBase64 = streamInfo.getString("psnAccountId");
        String accessToken = streamInfo.getString("accessToken");
        String nickName = streamInfo.getString("nickName");

        byte[] registKey = java.util.Base64.getDecoder().decode(registKeyBase64);
        byte[] morning = java.util.Base64.getDecoder().decode(morningBase64);
        byte[] psnAccountId = java.util.Base64.getDecoder().decode(psnAccountIdBase64);

        int width = streamInfo.getInt("width");
        int height = streamInfo.getInt("height");
        int fps = streamInfo.getInt("fps");
        int bitrate = streamInfo.getInt("bitrate");
        int maxOperatingRate = streamInfo.hasKey("maxOperatingRate")
                ? streamInfo.getInt("maxOperatingRate") : 0x7FFF;

        Codec codec = Codec.CODEC_H265;
        String streamCodec = streamInfo.getString("codec");
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
                width,
                height,
                fps,
                bitrate,
                codec,
                maxOperatingRate
        );

        ConnectInfo connectInfo = new ConnectInfo(
                ps5,
                host,
                parsedHost,
                registKey,
                morning,
                videoProfile,
                enableKeyboard,
                psnAccountId,
                accessToken,
                nickName
        );
        view.setConnectInfo(connectInfo, streamInfo);
    }

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        Log.d(REACT_CLASS, "View manager getCommandsMap:");
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
    public void receiveCommand(StreamFsrView view, String commandId, @Nullable ReadableArray args) {
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

                    ControllerTouch[] touches = new ControllerTouch[]{
                            new ControllerTouch((short) x1, (short) y1, (byte) id1),
                            new ControllerTouch((short) x2, (short) y2, (byte) id2)
                    };
                    view.handleTouchpad((int) mask, (byte) nextId, touches);
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

                    ControllerTouch[] touches = new ControllerTouch[]{
                            new ControllerTouch((short) x1, (short) y1, (byte) id1),
                            new ControllerTouch((short) x2, (short) y2, (byte) id2)
                    };
                    view.handleTouchpadTap(isPressed, (byte) nextId, touches);
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
                    view.handleUsbControllerEvent(
                            flags,
                            (float) leftStickX,
                            (float) leftStickY,
                            (float) rightStickX,
                            (float) rightStickY,
                            (float) leftTrigger,
                            (float) rightTrigger
                    );
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
                    boolean reject = args.getBoolean(0);
//                    view.switchKeyboard(reject);
                }
                break;
            }
            case COMMAND_SET_LOGIN_PIN: {
                if (args != null) {
                    String pin = args.getString(0);
                    view.setLoginPin(pin);
                }
                break;
            }
            default:
                throw new IllegalArgumentException(
                        String.format(
                                "Unsupported command %s received by %s.",
                                commandId,
                                getClass().getSimpleName()));
        }
    }
}
