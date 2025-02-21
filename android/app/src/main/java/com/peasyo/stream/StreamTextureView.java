package com.peasyo.stream;

import android.app.Application;
import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.Gravity;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.view.View;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.graphics.SurfaceTexture;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.peasyo.lib.*;
import com.peasyo.log.LogManager;
import com.peasyo.session.*;
import com.peasyo.utils.OrientationTracker;

import java.util.Objects;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class StreamTextureView extends FrameLayout implements TextureView.SurfaceTextureListener {

    static final String TAG = "StreamTextureView";

    OrientationTracker tracker;

    ControllerState controllerState;

    public static final int SCALE_MODE_FIT = 0;  // 保持宽高比
    public static final int SCALE_MODE_STRETCH = 1;  // 拉伸铺满
    public static final int SCALE_MODE_ZOOM = 2;  // 裁剪铺满

    private int scaleMode = SCALE_MODE_FIT;
    private float aspectRatio = 16f / 9f; // 16:9

    // Button masks
    static final int BUTTON_CROSS = (1 << 0);
    static final int BUTTON_MOON = (1 << 1);
    static final int BUTTON_BOX = (1 << 2);
    static final int BUTTON_PYRAMID = (1 << 3);
    static final int BUTTON_DPAD_LEFT = (1 << 4);
    static final int BUTTON_DPAD_RIGHT = (1 << 5);
    static final int BUTTON_DPAD_UP = (1 << 6);
    static final int BUTTON_DPAD_DOWN = (1 << 7);
    static final int BUTTON_L1 = (1 << 8);
    static final int BUTTON_R1 = (1 << 9);
    static final int BUTTON_L3 = (1 << 10);
    static final int BUTTON_R3 = (1 << 11);
    static final int BUTTON_OPTIONS = (1 << 12);
    static final int BUTTON_SHARE = (1 << 13);
    static final int BUTTON_TOUCHPAD = (1 << 14);
    static final int BUTTON_PS = (1 << 15);

    private TextureView textureView;
    private SurfaceTexture surfaceTexture;
    private SensorManager sensorManager;

    public StreamSession session;
    private ConnectInfo connectInfo;
    private boolean rumble;
    private int rumbleIntensity;
    private boolean usbMode;
    private String usbController;
    private boolean useSensor;
    private boolean sensorInvert;
    private float deadZone;
    private int edgeCompensation;
    private boolean isShortTrigger;
    private boolean isLeftTriggerCanClick;
    private boolean isRightTriggerCanClick;

    private boolean isRightstickMoving;

    private final ReactContext reactContext;

    public StreamTextureView(Context context) {
        super(context);
        this.reactContext = (ReactContext)context;
        this.rumble = true;
        this.rumbleIntensity = 3;
        this.usbMode = false;
        this.usbController = "Xbox360Controller";
        this.useSensor = false;
        this.sensorInvert = false;
        this.deadZone = 0.2f;
        this.edgeCompensation = 0;
        this.isShortTrigger = false;
        this.isLeftTriggerCanClick = false;
        this.isRightTriggerCanClick = false;
        this.isRightstickMoving = false;

        tracker = new OrientationTracker();
    }

    @Override
    public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surface, int width, int height) {
        Log.d(TAG, "onSurfaceTextureAvailable");
        if(surfaceTexture != null) {
            return;
        }
        surfaceTexture = surface;
    }

    @Override
    public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surfaceTexture, int width, int height) {}

    @Override
    public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surfaceTexture) {
        Log.d(TAG, "onSurfaceTextureDestroyed");
        return this.surfaceTexture == null;
    }

    @Override
    public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surfaceTexture) {}

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        Log.d(TAG, "onAttachedToWindow");
        requestPointerCapture();
        setOnCapturedPointerListener((v, event) -> {
            return true;
        });
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        Log.d(TAG, "onDetachedFromWindow");
        releasePointerCapture();
    }

    private void initView(Context context) {
        // Inflate your layout or create SurfaceView programmatically
        Log.d(TAG, "Init and add surfaceView");

        textureView = new TextureView(context);

        LayoutParams params = new LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT
        );

        params.gravity = Gravity.CENTER;
        textureView.setClipToOutline(true);
        textureView.setLayoutParams(params);
        textureView.setSurfaceTextureListener(this);
        textureView.setOpaque(false);

        textureView.setFocusable(true);
        textureView.setFocusableInTouchMode(true);

        addView(textureView);

        textureView.requestFocus();

        setFocusable(true);
        setFocusableInTouchMode(true);

        // Init sensor
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);

        controllerState = ControllerState.init();
        Log.d(TAG, "Initial controllerState: " + controllerState);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int viewWidth = MeasureSpec.getSize(widthMeasureSpec);
        int viewHeight = MeasureSpec.getSize(heightMeasureSpec);

        int calculatedWidth;
        int calculatedHeight;

        switch (this.scaleMode) {
            case SCALE_MODE_STRETCH: // 拉伸
                int newWidth = viewWidth - 1;
                int newHeight = viewHeight - 1;

                setMeasuredDimension(newWidth, newHeight);
                super.onMeasure(
                        MeasureSpec.makeMeasureSpec(newWidth, MeasureSpec.EXACTLY),
                        MeasureSpec.makeMeasureSpec(newHeight, MeasureSpec.EXACTLY)
                );
                break;
            case SCALE_MODE_ZOOM: // 缩放
                if (viewHeight > viewWidth * aspectRatio) {
                    // 以高度为基准进行缩放
                    float contentHeight = viewWidth / aspectRatio;
                    float zoomFactor = viewHeight / contentHeight;
                    calculatedWidth = (int)(viewWidth * zoomFactor);
                    calculatedHeight = viewHeight;
                } else {
                    // 以宽度为基准进行缩放
                    float contentWidth = viewHeight * aspectRatio;
                    float zoomFactor = viewWidth / contentWidth;
                    calculatedWidth = viewWidth;
                    calculatedHeight = (int)(viewHeight * zoomFactor);
                }
                setMeasuredDimension(calculatedWidth, calculatedHeight);
                super.onMeasure(
                        MeasureSpec.makeMeasureSpec(calculatedWidth, MeasureSpec.EXACTLY),
                        MeasureSpec.makeMeasureSpec(calculatedHeight, MeasureSpec.EXACTLY)
                );
                break;
            case SCALE_MODE_FIT: // 保持比例
            default:
                if (aspectRatio > 0) {
                    if (viewWidth / (float) viewHeight > aspectRatio) {
                        calculatedWidth = (int) (viewHeight * aspectRatio);
                        calculatedHeight = viewHeight;
                    } else {
                        calculatedWidth = viewWidth;
                        calculatedHeight = (int) (viewWidth / aspectRatio);
                    }

                    int newWidthSpec = MeasureSpec.makeMeasureSpec(calculatedWidth, MeasureSpec.EXACTLY);
                    int newHeightSpec = MeasureSpec.makeMeasureSpec(calculatedHeight, MeasureSpec.EXACTLY);
                    super.onMeasure(newWidthSpec, newHeightSpec);
                } else {
                    super.onMeasure(widthMeasureSpec, heightMeasureSpec);
                }
                break;
        }
    }

    public void setConnectInfo(ConnectInfo connectInfo, ReadableMap streamInfo) {
        Log.d(TAG, "native stream view connectInfo:" + connectInfo);
        Log.d(TAG, "native stream view streamInfo:" + streamInfo);

        this.connectInfo = connectInfo;

        boolean rumble = streamInfo.getBoolean("rumble");
        int rumbleIntensity = streamInfo.getInt("rumbleIntensity");
        boolean usbMode = streamInfo.getBoolean("usbMode");
        String usbController = streamInfo.getString("usbController");
        String videoFormat = streamInfo.getString("videoFormat");
        boolean useSensor = streamInfo.getBoolean("useSensor");
        boolean sensorInvert = streamInfo.getBoolean("sensorInvert");
        float deadZone = (float)streamInfo.getDouble("deadZone");
        int edgeCompensation = streamInfo.getInt("edgeCompensation");
        boolean shortTrigger = streamInfo.getBoolean("shortTrigger");
        ReadableMap gamepadMaping = streamInfo.getMap("gamepadMaping");

        if (gamepadMaping != null) {
            updateButtonMapping(gamepadMaping);
        }

        this.rumble = rumble;
        this.rumbleIntensity = rumbleIntensity;
        this.usbMode = usbMode;
        this.usbController = usbController;
        this.useSensor = useSensor;
        this.sensorInvert = sensorInvert;
        this.deadZone = deadZone;
        this.edgeCompensation = edgeCompensation;
        this.isShortTrigger = shortTrigger;

        if (videoFormat != null) {
            if (videoFormat.isEmpty()) {
                this.scaleMode = SCALE_MODE_FIT;
            } else if (videoFormat.equals("Stretch")) {
                this.scaleMode = SCALE_MODE_STRETCH;
            } else if (videoFormat.equals("Zoom")) {
                this.scaleMode = SCALE_MODE_ZOOM;
            } else if (videoFormat.equals("16:10")) {
                this.scaleMode = SCALE_MODE_FIT;
                this.aspectRatio = 4f / 3f;
            } else if (videoFormat.equals("18:9")) {
                this.scaleMode = SCALE_MODE_FIT;
                this.aspectRatio = 18f / 9f;
            } else if (videoFormat.equals("21:9")) {
                this.scaleMode = SCALE_MODE_FIT;
                this.aspectRatio = 21f / 9f;
            } else if (videoFormat.equals("4:3")) {
                this.scaleMode = SCALE_MODE_FIT;
                this.aspectRatio = 4f / 3f;
            }
            requestLayout();
        }

        initView(reactContext);
    }

    private void initSession(Context context) {
        Application application = (Application) context.getApplicationContext();

        LogManager logManager = new LogManager(application);

        // 初始化session
        session = new StreamSession(connectInfo, logManager, false, this.reactContext, this.rumble, this.rumbleIntensity, this.usbMode, this.usbController);

        session.resume();

        // 添加媒体流视图
        session.handleSessionSetSurface(surfaceTexture);
    }

    public void startSession() {
        Log.d(TAG, "native startSession called");
        initSession(getContext());
    }

    public void stopSession() {
        Log.d(TAG, "StopSession called");
        if (session != null) {
            session.shutdown();
        }
    }

    public void sleep() {
        Log.d(TAG, "native sleep called");
        if (session != null) {
            session.sleep();
        }
    }

    // 默认掩码映射
    private static Map<Integer, Integer> DEFAULT_MAPPING = Map.ofEntries(
            Map.entry(KeyEvent.KEYCODE_BUTTON_A, BUTTON_CROSS),
            Map.entry(KeyEvent.KEYCODE_BUTTON_B, BUTTON_MOON),
            Map.entry(KeyEvent.KEYCODE_BUTTON_X, BUTTON_BOX),
            Map.entry(KeyEvent.KEYCODE_BUTTON_Y, BUTTON_PYRAMID),
            Map.entry(KeyEvent.KEYCODE_BUTTON_L1, BUTTON_L1),
            Map.entry(KeyEvent.KEYCODE_BUTTON_R1, BUTTON_R1),
            Map.entry(KeyEvent.KEYCODE_DPAD_UP, BUTTON_DPAD_UP),
            Map.entry(KeyEvent.KEYCODE_DPAD_DOWN, BUTTON_DPAD_DOWN),
            Map.entry(KeyEvent.KEYCODE_DPAD_LEFT, BUTTON_DPAD_LEFT),
            Map.entry(KeyEvent.KEYCODE_DPAD_RIGHT, BUTTON_DPAD_RIGHT),
            Map.entry(KeyEvent.KEYCODE_BUTTON_THUMBL, BUTTON_L3),
            Map.entry(KeyEvent.KEYCODE_BUTTON_THUMBR, BUTTON_R3),
            Map.entry(KeyEvent.KEYCODE_BUTTON_SELECT, BUTTON_SHARE),
            Map.entry(KeyEvent.KEYCODE_BUTTON_START, BUTTON_OPTIONS),
            Map.entry(KeyEvent.KEYCODE_BUTTON_C, BUTTON_PS),
            Map.entry(KeyEvent.KEYCODE_BUTTON_MODE, BUTTON_PS)
    );
    private static Map<Integer, Integer> BUTTON_MAPPING = new HashMap<>(DEFAULT_MAPPING);

    // 更新自定义映射
    public void updateButtonMapping(ReadableMap mapping) {
        if (mapping == null || mapping.toHashMap().isEmpty()) {
            BUTTON_MAPPING = new HashMap<>(DEFAULT_MAPPING);
            return;
        }

        Map<Integer, Integer> newMapping = new HashMap<>(DEFAULT_MAPPING);

        // 处理各个按键的映射
        if (mapping.hasKey("A")) {
            newMapping.put(mapping.getInt("A"), BUTTON_CROSS);
        }
        if (mapping.hasKey("B")) {
            newMapping.put(mapping.getInt("B"), BUTTON_MOON);
        }
        if (mapping.hasKey("X")) {
            newMapping.put(mapping.getInt("X"), BUTTON_BOX);
        }
        if (mapping.hasKey("Y")) {
            newMapping.put(mapping.getInt("Y"), BUTTON_PYRAMID);
        }
        if (mapping.hasKey("LeftShoulder")) {
            newMapping.put(mapping.getInt("LeftShoulder"), BUTTON_L1);
        }
        if (mapping.hasKey("RightShoulder")) {
            newMapping.put(mapping.getInt("RightShoulder"), BUTTON_R1);
        }
        if (mapping.hasKey("DPadUp")) {
            newMapping.put(mapping.getInt("DPadUp"), BUTTON_DPAD_UP);
        }
        if (mapping.hasKey("DPadDown")) {
            newMapping.put(mapping.getInt("DPadDown"), BUTTON_DPAD_DOWN);
        }
        if (mapping.hasKey("DPadLeft")) {
            newMapping.put(mapping.getInt("DPadLeft"), BUTTON_DPAD_LEFT);
        }
        if (mapping.hasKey("DPadRight")) {
            newMapping.put(mapping.getInt("DPadRight"), BUTTON_DPAD_RIGHT);
        }
        if (mapping.hasKey("LeftThumb")) {
            newMapping.put(mapping.getInt("LeftThumb"), BUTTON_L3);
        }
        if (mapping.hasKey("RightThumb")) {
            newMapping.put(mapping.getInt("RightThumb"), BUTTON_R3);
        }
        if (mapping.hasKey("View")) {
            newMapping.put(mapping.getInt("View"), BUTTON_SHARE);
        }
        if (mapping.hasKey("Menu")) {
            newMapping.put(mapping.getInt("Menu"), BUTTON_OPTIONS);
        }
        if (mapping.hasKey("Nexus")) {
            newMapping.put(mapping.getInt("Nexus"), BUTTON_PS);
        }

        // 更新全局映射
        BUTTON_MAPPING = Collections.unmodifiableMap(newMapping);
    }

    private int getButtonMask(int keyCode) {
        Integer mask = BUTTON_MAPPING.get(keyCode);
        return mask != null ? mask : 0;
    }

    // 处理实体按键事件
    public boolean handleKeyEvent(KeyEvent event) {
        Log.d(TAG, "handleKeyEvent:" +  event);
        if(event.getKeyCode() == KeyEvent.KEYCODE_BACK || event.getKeyCode() == KeyEvent.KEYCODE_VOLUME_DOWN || event.getKeyCode() == KeyEvent.KEYCODE_VOLUME_UP || (event.getAction() != KeyEvent.ACTION_DOWN && event.getAction() != KeyEvent.ACTION_UP))
            return false;
        int buttonMask = getButtonMask(event.getKeyCode());

        int buttons = controllerState.getButtons();
        switch (event.getAction()) {
            case KeyEvent.ACTION_DOWN:
                buttons |= buttonMask;  // Set the bit using OR
                break;
            case KeyEvent.ACTION_UP:
                buttons &= ~buttonMask; // Clear the bit using AND with inverted mask
                break;
        }

        if (event.getKeyCode() == KeyEvent.KEYCODE_BUTTON_L2) {
            this.isLeftTriggerCanClick = true;
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                controllerState.setL2State(unsignedAxis(1));
            } else {
                controllerState.setL2State(unsignedAxis(0));
            }
        }
        if (event.getKeyCode() == KeyEvent.KEYCODE_BUTTON_R2) {
            this.isRightTriggerCanClick = true;
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                controllerState.setR2State(unsignedAxis(1));
            } else {
                controllerState.setR2State(unsignedAxis(0));
            }
        }

        controllerState.setButtons(buttons);

        setControllerState(controllerState);
        return true;
    }

    // 虚拟按键事件
    public void handleVirtualButton(int buttonMask, boolean isPressed) {
        int buttons = controllerState.getButtons();
        if (isPressed) {
            buttons |= buttonMask;  // Set the bit using OR
        } else {
            buttons &= ~buttonMask; // Clear the bit using AND with inverted mask
        }

        controllerState.setButtons(buttons);
        setControllerState(controllerState);
    }
    // 扳机按键事件
    public void handleVirtualTriggerButton(String name, float value) {
        if (Objects.equals(name, "left")) {
            controllerState.setL2State(unsignedAxis(value));
            setControllerState(controllerState);
        } else if (Objects.equals(name, "right")) {
            controllerState.setR2State(unsignedAxis(value));
            setControllerState(controllerState);
        }

    }

    // 摇杆虚拟按键事件
    public void handleVirtualStick(String name, float x, float y) {
        if (Objects.equals(name, "left")) {
            controllerState.setLeftX(signedAxis(x));
            controllerState.setLeftY(signedAxis(y));
            setControllerState(controllerState);
        } else if (Objects.equals(name, "right")) {
            controllerState.setRightX(signedAxis(x));
            controllerState.setRightY(signedAxis(y));
            setControllerState(controllerState);
        }
    }

    // 陀螺仪模拟摇杆
    public void handleSensorStick(float x, float y) {
        // gyroscope only work when Rightstick not moving and L2 button press
        if (!isRightstickMoving && controllerState.getL2State() >= this.deadZone) {
            controllerState.setRightX(signedAxis(x));
            controllerState.setRightY(signedAxis(y));
        } else {
            controllerState.setRightX(signedAxis(0));
            controllerState.setRightY(signedAxis(0));
        }
        setControllerState(controllerState);
    }

    // 触摸板事件
    public void handleTouchpad(int buttonMask, byte idNext, ControllerTouch[] touches ) {
        controllerState.setButtons(0);
        controllerState.setTouchIdNext(idNext);
        controllerState.setTouches(touches);

        setControllerState(controllerState);
    }

    // 触摸板点击
    public void handleTouchpadTap(boolean isPressed, byte idNext, ControllerTouch[] touches ) {

        int buttons = controllerState.getButtons();
        if (isPressed) {
            buttons |= BUTTON_TOUCHPAD;
        } else {
            buttons &= ~BUTTON_TOUCHPAD;
        }

        controllerState.setButtons(buttons);
        controllerState.setTouchIdNext(idNext);
        controllerState.setTouches(touches);

        setControllerState(controllerState);
    }

    // 覆盖usb手柄模式手柄事件
    public void handleUsbControllerEvent(int flags, float leftStickX, float leftStickY, float rightStickX, float rightStickY, float leftTrigger, float rightTrigger) {
        controllerState.setButtons(flags);
        controllerState.setLeftX(signedAxis(leftStickX));
        controllerState.setLeftY(signedAxis(leftStickY));
        controllerState.setRightX(signedAxis(rightStickX));
        controllerState.setRightY(signedAxis(rightStickY));
        controllerState.setL2State(unsignedAxis(leftTrigger));
        controllerState.setR2State(unsignedAxis(rightTrigger));

        setControllerState(controllerState);
    }

    // DS controller override
    public void handleUsbDsControllerEvent(
            int flags,
            float leftStickX,
            float leftStickY,
            float rightStickX,
            float rightStickY,
            float leftTrigger,
            float rightTrigger,
            float gyrox,
            float gyroy,
            float gyroz,
            float accelx,
            float accely,
            float accelz,
            int touch0id,
            int touch0x,
            int touch0y,
            int touch1id,
            int touch1x,
            int touch1y
    ) {
        controllerState.setButtons(flags);
        controllerState.setLeftX(signedAxis(leftStickX));
        controllerState.setLeftY(signedAxis(-leftStickY));
        controllerState.setRightX(signedAxis(rightStickX));
        controllerState.setRightY(signedAxis(-rightStickY));
        controllerState.setL2State(unsignedAxis(leftTrigger));
        controllerState.setR2State(unsignedAxis(rightTrigger));

        float accelX = accelx / 8192f;
        float accelY = accely / 8192f;
        float accelZ = accelz / 8192f;

        float[] accelArray = {accelX, accelY, accelZ};
        boolean hasAccel = false;
        int count = 0;

        for (float value : accelArray) {
            if (Math.abs(value) > 0.3) {
                count++;
            }
        }

        if (count == 3) {
            hasAccel = true;
        }

        if ((Math.abs(gyrox / 10) > 10 || Math.abs(gyroy / 10) > 10 || Math.abs(gyroz / 10) > 10)) {

            if (hasAccel) {
                controllerState.setGyroX(gyrox);
                controllerState.setGyroY(gyroy);
                controllerState.setGyroZ(gyroz);

                controllerState.setAccelX(accelX);
                controllerState.setAccelY(accelY);
                controllerState.setAccelZ(accelZ);

                OrientationTracker.AccelNewZero accelZero = new OrientationTracker.AccelNewZero();

                float[] orientation = tracker.update(gyrox, gyroy, gyroz,
                        accelX, accelY, accelZ,
                        accelZero, true,
                        System.nanoTime() / 1000);

                controllerState.setOrientX(orientation[1]);
                controllerState.setOrientY(orientation[2]);
                controllerState.setOrientZ(-orientation[3]);
                controllerState.setOrientW(-orientation[0]);
            } else {
                controllerState.setGyroX(gyrox);
                controllerState.setGyroY(gyroy);
                controllerState.setGyroZ(gyroz);

                OrientationTracker.AccelNewZero accelZero = new OrientationTracker.AccelNewZero();

                float[] orientation = tracker.update(gyrox, gyroy, gyroz,
                        accelX, accelY, accelZ,
                        accelZero, true,
                        System.nanoTime() / 1000);

                // FIXME: Pitch direction is incorrect
                controllerState.setOrientX(orientation[1]);
                controllerState.setOrientY(orientation[2]);
                controllerState.setOrientZ(-orientation[3]);
                controllerState.setOrientW(-orientation[0]);
            }
        }

        ControllerTouch[] touches = new ControllerTouch[] {
                new ControllerTouch((short)touch0x, (short)touch0y, (byte)touch0id),
                new ControllerTouch((short)touch1x, (short)touch1y, (byte)touch1id)
        };

        int idNext = Math.max(touch0id, touch1id) + 1;
        if (idNext > 125) {
            idNext = 0;
        }
        controllerState.setTouchIdNext((byte)idNext);
        controllerState.setTouches(touches);
        setControllerState(controllerState);
    }

    public void setControllerState(ControllerState controllerState) {
//        Log.d(TAG, "setControllerState:" + controllerState);
        if (session != null) {
            session.setControllerState(controllerState);
        }
    }

    // 获取性能信息
    public void handleGetPerformance() {
//        Log.d(TAG, "handleGetPerformance");
        if (session != null) {
            Session innerSession = session.getSession();
            if (innerSession != null) {
                session.getSession().getPerformance();
            }
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        return handleKeyEvent(event) || super.dispatchKeyEvent(event);
    }

    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        return handleGenericMotionEvent(event) || super.onGenericMotionEvent(event);
    }

    private static InputDevice.MotionRange getMotionRangeForJoystickAxis(InputDevice dev, int axis) {
        InputDevice.MotionRange range;

        // First get the axis for SOURCE_JOYSTICK
        range = dev.getMotionRange(axis, InputDevice.SOURCE_JOYSTICK);
        if (range == null) {
            // Now try the axis for SOURCE_GAMEPAD
            range = dev.getMotionRange(axis, InputDevice.SOURCE_GAMEPAD);
        }

        return range;
    }

    private static float getCenteredAxis(MotionEvent event,
                                         InputDevice device, int axis, int historyPos) {
        final InputDevice.MotionRange range =
                device.getMotionRange(axis, event.getSource());

        // A joystick at rest does not always report an absolute position of
        // (0,0). Use the getFlat() method to determine the range of values
        // bounding the joystick axis center.
        if (range != null) {
            final float flat = range.getFlat();
            final float value =
                    historyPos < 0 ? event.getAxisValue(axis):
                            event.getHistoricalAxisValue(axis, historyPos);

            // Ignore axis values that are within the 'flat' region of the
            // joystick axis center.
            if (Math.abs(value) > flat) {
                return value;
            }
        }
        return 0;
    }

    private short signedAxis(float value) {
        return (short)((int)(value * Short.MAX_VALUE));
    }

    private byte unsignedAxis(float value) {
        return (byte)((int)(value * 255.0f));
    }

    private void processJoystickInput(MotionEvent event,
                                      int historyPos) {

        InputDevice inputDevice = event.getDevice();

        // Calculate the horizontal distance to move by
        // using the input value from one of these physical controls:
        // the left control stick, hat axis, or the right control stick.
        float x = getCenteredAxis(event, inputDevice,
                MotionEvent.AXIS_X, historyPos);

        float rx = getCenteredAxis(event, inputDevice,
                MotionEvent.AXIS_Z, historyPos);

        // Calculate the vertical distance to move by
        // using the input value from one of these physical controls:
        // the left control stick, hat switch, or the right control stick.
        float y = getCenteredAxis(event, inputDevice,
                MotionEvent.AXIS_Y, historyPos);

        float ry = getCenteredAxis(event, inputDevice,
                MotionEvent.AXIS_RZ, historyPos);

        x = normaliseAxis(x);
        y = normaliseAxis(y);
        rx = normaliseAxis(rx);
        ry = normaliseAxis(ry);

        Log.d(TAG, "left axisX:" + x);
        Log.d(TAG, "left axisY:" + y);

        Log.d(TAG, "right axisX:" + rx);
        Log.d(TAG, "right axisY:" + ry);

        if (Math.abs(rx) > 0.1 || Math.abs(ry) > 0.1) {
            isRightstickMoving = true;
        } else {
            isRightstickMoving = false;
        }

        controllerState.setLeftX(signedAxis(x));
        controllerState.setLeftY(signedAxis(y));
        controllerState.setRightX(signedAxis(rx));
        controllerState.setRightY(signedAxis(ry));

        setControllerState(controllerState);
    }

    float normaliseAxis(float value) {
        if (this.deadZone > 0) {
            if (Math.abs(value) < this.deadZone) {
                return 0;
            }

            value = value - Math.signum(value) * this.deadZone;
            value /= 1.0 - this.deadZone;

            // Joystick edge compensation
            final double THRESHOLD = 0.8;
            final double MAX_VALUE = 1.0;
            float compensation = this.edgeCompensation / 100.0f;

            if (Math.abs(value) > THRESHOLD) {
                if (value > 0) {
                    value = (float) Math.min(value + compensation, MAX_VALUE);
                } else {
                    value = (float) Math.max(value - compensation, -MAX_VALUE);
                }
            }
            return value;
        } else {
            return value;
        }
    }

    private float initialX, initialY;
    private int currentId = -1;
    private int nextId = -1;
    private int touchId1 = -1;
    private int touchId2 = -1;

    private boolean isTouchpadTap = false;

    private void handleTouchpadMoveStart(MotionEvent event) {
        currentId = currentId + 1;
        nextId = currentId + 1;
        touchId1 = currentId;

        int pointerCount = event.getPointerCount();
        if (pointerCount >= 2) {
            currentId = currentId + 1;
            nextId = currentId + 1;
            touchId2 = currentId;
        }

        if (nextId >= 120) {
            currentId = -1;
            nextId = -1;
            touchId1 = -1;
            touchId2 = -1;
        }
    }

    private void handleTouchpadMove(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();
//        Log.d(TAG, "Touchpad moved to X=" + x + ", Y=" + y);

        float secondX = 0;
        float secondY = 0;

        int pointerCount = event.getPointerCount();

        if (pointerCount >= 2) {
            secondX = event.getX(1);
            secondY = event.getY(1);

//            Log.d(TAG, "Second finger coordinates: X=" + secondX + ", Y=" + secondY);
        }

        ControllerTouch[] touches = new ControllerTouch[] {
                new ControllerTouch((short)x, (short)y, (byte)touchId1),
                new ControllerTouch((short)secondX, (short)secondY, (byte)touchId2)
        };
        handleTouchpadTap(false, (byte)nextId, touches);
    }

    private void handleTouchpadMoveEnd(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();

        float secondX = 0;
        float secondY = 0;

        int pointerCount = event.getPointerCount();

        if (pointerCount >= 2) {
            int secondPointerIndex = 1;

            secondX = event.getX(secondPointerIndex);
            secondY = event.getY(secondPointerIndex);
        }

        ControllerTouch[] touches = new ControllerTouch[] {
                new ControllerTouch((short)x, (short)y, (byte)-1),
                new ControllerTouch((short)secondX, (short)secondY, (byte)-1)
        };
        handleTouchpadTap(false, (byte)nextId, touches);
    }

    public boolean handleGenericMotionEvent(MotionEvent event) {
        InputDevice inputDevice = event.getDevice();

        // Touchpad tap
        if ((inputDevice.getSources() & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD) {
            if (event.getAction() == MotionEvent.ACTION_BUTTON_PRESS ||
                    event.getAction() == MotionEvent.ACTION_BUTTON_RELEASE) {

                currentId = currentId + 1;
                nextId = currentId + 1;
                touchId1 = currentId;

                ControllerTouch[] touches = new ControllerTouch[] {
                        new ControllerTouch((short)event.getX(), (short)event.getY(), (byte)touchId1),
                        new ControllerTouch((short)0, (short)0, (byte)-1)
                };

                if (event.getAction() == MotionEvent.ACTION_BUTTON_PRESS) {
                    handleTouchpadTap(true, (byte)nextId, touches);
                    isTouchpadTap = true;
                } else {
                    handleTouchpadTap(false, (byte)-1, touches);
                    isTouchpadTap = false;
                }

                if (nextId >= 120) {
                    currentId = -1;
                    nextId = -1;
                    touchId1 = -1;
                    touchId2 = -1;
                }

                return true;
            }
        }

        // Touchpad move
        if ((event.getSource() & InputDevice.SOURCE_TOUCHPAD) != 0 && !isTouchpadTap) {
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    initialX = event.getX();
                    initialY = event.getY();
                    handleTouchpadMoveStart(event);

                    return true;
                case MotionEvent.ACTION_UP:
                    handleTouchpadMoveEnd(event);
                    return true;
                case MotionEvent.ACTION_MOVE:
                    float currentX = event.getX();
                    float currentY = event.getY();
                    float deltaX = currentX - initialX;
                    float deltaY = currentY - initialY;
//                    float distance = (float) Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    handleTouchpadMove(event);

                    return true;
            }
        }

        if ((event.getSource() & InputDevice.SOURCE_CLASS_JOYSTICK) != InputDevice.SOURCE_CLASS_JOYSTICK) {
            return false;
        }

        // DPAD
        Dpad dpad = new Dpad();
        if (Dpad.isDpadDevice(event)) {
            int dpadIdx = dpad.getDirectionPressed(event);
            if (dpadIdx != -1) { // Dpad down
                Log.d("StreamView", "DPAD press:" + dpadIdx);
                int buttonMask = getButtonMask(dpadIdx);

                int buttons = controllerState.getButtons();
                buttons |= buttonMask;

                controllerState.setButtons(buttons);
            } else { // Dpad up
                int buttons = controllerState.getButtons();
                buttons &= ~BUTTON_DPAD_LEFT;
                buttons &= ~BUTTON_DPAD_RIGHT;
                buttons &= ~BUTTON_DPAD_UP;
                buttons &= ~BUTTON_DPAD_DOWN;

                controllerState.setButtons(buttons);
            }
        }

        // Joystick
        if ((event.getSource() & InputDevice.SOURCE_JOYSTICK) ==
                InputDevice.SOURCE_JOYSTICK &&
                event.getAction() == MotionEvent.ACTION_MOVE) {
            // Process all historical movement samples in the batch
            final int historySize = event.getHistorySize();

            InputDevice.MotionRange leftTriggerRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_LTRIGGER);
            InputDevice.MotionRange rightTriggerRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_RTRIGGER);
            InputDevice.MotionRange brakeRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_BRAKE);
            InputDevice.MotionRange gasRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_GAS);
            InputDevice.MotionRange throttleRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_THROTTLE);

            // Left Trigger
            float lTrigger = 0;
            // Right Trigger
            float rTrigger = 0;
            if (leftTriggerRange != null && rightTriggerRange != null)
            {
                // Some controllers use LTRIGGER and RTRIGGER (like Ouya)
                lTrigger = event.getAxisValue(MotionEvent.AXIS_LTRIGGER);
                rTrigger = event.getAxisValue(MotionEvent.AXIS_RTRIGGER);
            }
            else if (brakeRange != null && gasRange != null)
            {
                // Others use GAS and BRAKE (like Moga)
                lTrigger = event.getAxisValue(MotionEvent.AXIS_BRAKE);
                rTrigger = event.getAxisValue(MotionEvent.AXIS_GAS);
            }
            else if (brakeRange != null && throttleRange != null)
            {
                // Others use THROTTLE and BRAKE (like Xiaomi)
                lTrigger = event.getAxisValue(MotionEvent.AXIS_BRAKE);
                rTrigger = event.getAxisValue(MotionEvent.AXIS_THROTTLE);
            }
            else
            {
                InputDevice.MotionRange rxRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_RX);
                InputDevice.MotionRange ryRange = getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_RY);
                String devName = inputDevice.getName();
                if (rxRange != null && ryRange != null && devName != null) {
                    boolean isNonStandardDualShock4 = false;
                    if (inputDevice.getVendorId() == 0x054c) { // Sony
                        if (inputDevice.hasKeys(KeyEvent.KEYCODE_BUTTON_C)[0]) {
                            Log.d(TAG, "Detected non-standard DualShock 4 mapping");
                            isNonStandardDualShock4 = true;
                        }
                    }

                    if (isNonStandardDualShock4) {
                        // The old DS4 driver uses RX and RY for triggers
                        lTrigger = event.getAxisValue(MotionEvent.AXIS_RX);
                        rTrigger = event.getAxisValue(MotionEvent.AXIS_RY);
                    }
                    else {
                        // While it's likely that Z and RZ are triggers, we may have digital trigger buttons
                        // instead. We must check that we actually have Z and RZ axes before assigning them.
                        if (getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_Z) != null &&
                                getMotionRangeForJoystickAxis(inputDevice, MotionEvent.AXIS_RZ) != null) {
                            lTrigger = event.getAxisValue(MotionEvent.AXIS_Z);
                            rTrigger = event.getAxisValue(MotionEvent.AXIS_RZ);
                        }
                    }
                }
            }

            Log.d(TAG, "Left Trigger:" + lTrigger);
            Log.d(TAG, "Right Trigger:" + rTrigger);
            // Short trigger
            if (this.isShortTrigger) {
                float triggerMax = this.deadZone + 0.1f;
                if (lTrigger >= triggerMax) {
                    lTrigger = 1;
                }
                if (rTrigger >= triggerMax) {
                    rTrigger = 1;
                }
            }

            if (!this.isLeftTriggerCanClick) {
                controllerState.setL2State(unsignedAxis(lTrigger));
            }

            if (!this.isRightTriggerCanClick) {
                controllerState.setR2State(unsignedAxis(rTrigger));
            }

            // Process the movements starting from the
            // earliest historical position in the batch
            for (int i = 0; i < historySize; i++) {
                // Process the event at historical position i
                processJoystickInput(event, i);
            }

            // Process the current movement sample in the batch (position -1)
            processJoystickInput(event, -1);
        }

        return true;
    }

    public void startSensorListener() {
        int samplingPeriodUs = 4000;
        Sensor accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        Sensor gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        Sensor rotationVector = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        Sensor gameRotationVector = sensorManager.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR);

        if (accelerometer != null) {
            sensorManager.registerListener(sensorEventListener, accelerometer, samplingPeriodUs);
        }
        if (gyroscope != null) {
            sensorManager.registerListener(sensorEventListener, gyroscope, samplingPeriodUs);
        }
        if (rotationVector != null) {
            sensorManager.registerListener(sensorEventListener, rotationVector, samplingPeriodUs);
        }
        // Some device has game rotation vector only
        if (rotationVector == null && gameRotationVector != null) {
            sensorManager.registerListener(sensorEventListener, gameRotationVector, samplingPeriodUs);
        }
    }

    public void stopSensorListener() {
        sensorManager.unregisterListener(sensorEventListener);
    }

    private final SensorEventListener sensorEventListener = new SensorEventListener() {
        @Override
        public void onSensorChanged(SensorEvent event) {
            switch (event.sensor.getType()) {
                case Sensor.TYPE_ACCELEROMETER:
                    controllerState.setAccelX(-event.values[1] / SensorManager.GRAVITY_EARTH);
                    controllerState.setAccelY(event.values[2] / SensorManager.GRAVITY_EARTH);
                    controllerState.setAccelZ(-event.values[0] / SensorManager.GRAVITY_EARTH);
                    break;
                case Sensor.TYPE_GYROSCOPE:
                    controllerState.setGyroX(-event.values[1]);
                    controllerState.setGyroY(event.values[2]);
                    controllerState.setGyroZ(-event.values[0]);
                    break;
                case Sensor.TYPE_ROTATION_VECTOR:
                case Sensor.TYPE_GAME_ROTATION_VECTOR:
                    float[] quaternion = new float[4];
                    SensorManager.getQuaternionFromVector(quaternion, event.values);
                    if (StreamTextureView.this.sensorInvert) {
                        controllerState.setOrientX(quaternion[2]);
                        controllerState.setOrientY(-quaternion[3]);
                        controllerState.setOrientZ(quaternion[1]);
                        controllerState.setOrientW(quaternion[0]);
                    } else {
                        controllerState.setOrientX(-quaternion[2]);
                        controllerState.setOrientY(quaternion[3]);
                        controllerState.setOrientZ(-quaternion[1]);
                        controllerState.setOrientW(quaternion[0]);
                    }
                    break;
            }

            setControllerState(controllerState);
        }

        @Override
        public void onAccuracyChanged(Sensor sensor, int accuracy) {}
    };
}
