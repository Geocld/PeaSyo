package com.peasyo;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * WiFi 性能模式的 React Native 桥接模块
 */
public class WifiPerformanceModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "WifiPerformanceModule";
    private static final String PREFS_NAME = "PeasyoSettings";
    private static final String KEY_WIFI_PERFORMANCE_MODE = "USE_WIFI_PERFORMANCE_MODE";

    private final WifiPerformanceManager wifiPerformanceManager;
    private final SharedPreferences sharedPreferences;

    public WifiPerformanceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.wifiPerformanceManager = new WifiPerformanceManager(reactContext);
        this.sharedPreferences = reactContext.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
        );
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * 启用 WiFi 性能模式
     */
    @ReactMethod
    public void enableWifiPerformanceMode(Promise promise) {
        try {
            MainActivity mainActivity = MainActivity.instance;
            if (mainActivity != null) {
                mainActivity.enableWifiPerformanceMode();
                promise.resolve(true);
            } else {
                promise.reject("NO_ACTIVITY", "MainActivity instance not available");
            }
        } catch (Exception e) {
            promise.reject("ENABLE_ERROR", "Failed to enable WiFi performance mode", e);
        }
    }

    /**
     * 禁用 WiFi 性能模式
     */
    @ReactMethod
    public void disableWifiPerformanceMode(Promise promise) {
        try {
            MainActivity mainActivity = MainActivity.instance;
            if (mainActivity != null) {
                mainActivity.disableWifiPerformanceMode();
                promise.resolve(true);
            } else {
                promise.reject("NO_ACTIVITY", "MainActivity instance not available");
            }
        } catch (Exception e) {
            promise.reject("DISABLE_ERROR", "Failed to disable WiFi performance mode", e);
        }
    }

    /**
     * 检查 WiFi 性能模式是否启用
     */
    @ReactMethod
    public void isWifiPerformanceModeEnabled(Promise promise) {
        try {
            boolean isEnabled = wifiPerformanceManager.isAcquired();
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("CHECK_ERROR", "Failed to check WiFi performance mode status", e);
        }
    }

    /**
     * 获取配置中的 WiFi 性能模式开关状态
     */
    @ReactMethod
    public void getWifiPerformanceModeSetting(Promise promise) {
        try {
            boolean enabled = sharedPreferences.getBoolean(KEY_WIFI_PERFORMANCE_MODE, true);
            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("GET_SETTING_ERROR", "Failed to get WiFi performance mode setting", e);
        }
    }

    /**
     * 保存 WiFi 性能模式开关状态到配置
     */
    @ReactMethod
    public void setWifiPerformanceModeSetting(boolean enabled, Promise promise) {
        try {
            sharedPreferences.edit()
                    .putBoolean(KEY_WIFI_PERFORMANCE_MODE, enabled)
                    .apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SET_SETTING_ERROR", "Failed to set WiFi performance mode setting", e);
        }
    }
}
