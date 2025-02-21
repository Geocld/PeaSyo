package com.peasyo;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import org.devio.rn.splashscreen.SplashScreen;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.view.InputEvent;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.InputDevice;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import android.view.View;
import android.content.ComponentName;
import android.content.Intent;
import android.os.IBinder;
import android.app.Service;
import android.content.ServiceConnection;
import android.view.WindowManager;

import com.peasyo.input.UsbDriverService;
import com.peasyo.input.ControllerHandler;
import com.peasyo.lib.*;
import com.peasyo.stream.Dpad;

public class MainActivity extends ReactActivity implements UsbDriverService.UsbDriverStateListener {

  public static MainActivity instance;
  private boolean pendingPipMode = false;

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "peasyo";
  }

  @Override
  public void onUsbPermissionPromptStarting() {
  }

  @Override
  public void onUsbPermissionPromptCompleted() {
  }

  private boolean connectedToUsbDriverService = false;
  private ControllerHandler controllerHandler;
  private final ServiceConnection usbDriverServiceConnection = new ServiceConnection() {
    @Override
    public void onServiceConnected(ComponentName componentName, IBinder iBinder) {
      UsbDriverService.UsbDriverBinder binder = (UsbDriverService.UsbDriverBinder) iBinder;
      binder.setListener(controllerHandler);
      binder.setStateListener(MainActivity.this);
      binder.start();
      connectedToUsbDriverService = true;
    }

    @Override
    public void onServiceDisconnected(ComponentName componentName) {
      connectedToUsbDriverService = false;
    }
  };

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);

    instance = this;

    // 原生方法测试1
    //    ErrorCode testCode = new ErrorCode(0);
    //    Log.d("MainActivity1", "testCode:" + testCode.toString());

    // 原生方法测试
    Hello test = new Hello(0);
    test.say();

    controllerHandler = new ControllerHandler(this);

    // Start the USB driver
    bindService(new Intent(this, UsbDriverService.class),
            usbDriverServiceConnection, Service.BIND_AUTO_CREATE);

    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  }

  public void handleRumble(short lowFreMotor, short highFreMotor) {
    this.controllerHandler.handleRumble(lowFreMotor, highFreMotor);
  }

  public void handleRumbleTrigger(short leftTrigger, short rightTrigger) {
    this.controllerHandler.handleRumbleTriggers(leftTrigger, rightTrigger);
  }

  public void handleSendCommand(byte[] data) {
    this.controllerHandler.handleSendCommand(data);
  }

  public void sendEvent(String eventName, WritableMap params) {
    ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();

    if (reactContext != null) {
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    String currentScreen = GamepadManager.getCurrentScreen();
    Log.d("MainActivity", "keyCode down:" + keyCode);
    Log.d("MainActivity", "currentScreen:" + currentScreen);

    if (!currentScreen.equals("stream")) {
      return super.onKeyDown(keyCode, event);
    }
    if ((event.getSource() & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD) {
      WritableMap params = Arguments.createMap();
      params.putInt("keyCode", keyCode);
      Log.d("MainActivity", "keyCode down2:" + params);
      sendEvent("onGamepadKeyDown", params);
      return true;
    }
    return super.onKeyDown(keyCode, event);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    String currentScreen = GamepadManager.getCurrentScreen();

    if (!currentScreen.equals("stream")) {
      return super.onKeyUp(keyCode, event);
    }
    if ((event.getSource() & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD) {
      WritableMap params = Arguments.createMap();
      params.putInt("keyCode", keyCode);
      Log.d("MainActivity", "keyCode up:" + params);
      sendEvent("onGamepadKeyUp", params);
      return true;
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public boolean onGenericMotionEvent(MotionEvent event) {
    String currentScreen = GamepadManager.getCurrentScreen();

    if (!currentScreen.equals("stream")) {
      return super.onGenericMotionEvent(event);
    }

    Dpad dpad = new Dpad();
    if (Dpad.isDpadDevice(event)) {
      int dpadIdx = dpad.getDirectionPressed(event);
      if (dpadIdx != -1) {
        Log.d("MainActivity", "DPAD press:" + dpadIdx);
        WritableMap params = Arguments.createMap();
        params.putInt("dpadIdx", dpadIdx);
        sendEvent("onDpadKeyDown", params);
      } else {
        WritableMap params = Arguments.createMap();
        params.putInt("dpadIdx", -1);
        sendEvent("onDpadKeyUp", params);
      }
    }
    return true;
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    SplashScreen.show(this);
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }

}
