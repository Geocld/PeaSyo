package com.peasyo.external;

import android.app.Activity;
import android.os.Build;
import android.view.WindowManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.peasyo.session.ExternalDisplayController;

public class ExternalDisplayModule extends ReactContextBaseJavaModule {

    private static final String TAG = "ExternalDisplayModule";

    public ExternalDisplayModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ExternalDisplayManager";
    }

    private ExternalDisplayController getController() {
        return ExternalDisplayController.getInstance(getReactApplicationContext());
    }

    /** 是否存在可用的外接显示器 */
    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isAvailable() {
        return getController().isExternalDisplayAvailable();
    }

    /** 开启外屏输出：画面 + 音频切换到外接显示器 */
    @ReactMethod
    public void enableOutput(final Promise promise) {
        try {
            getController().enable((success, error) -> {
                if (success) {
                    promise.resolve(true);
                } else {
                    promise.reject("ENABLE_FAILED", error == null ? "unknown" : error);
                }
                return kotlin.Unit.INSTANCE;
            });
        } catch (Exception e) {
            promise.reject("ENABLE_FAILED", e.getMessage());
        }
    }

    /** 关闭外屏输出，切回手机 */
    @ReactMethod
    public void disableOutput(final Promise promise) {
        try {
            getController().disable(success -> {
                promise.resolve(success);
                return kotlin.Unit.INSTANCE;
            });
        } catch (Exception e) {
            promise.reject("DISABLE_FAILED", e.getMessage());
        }
    }

    /** 外屏输出是否激活（供 JS 同步查询） */
    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isOutputActive() {
        return getController().isOutputActive();
    }

    /**
     * 挂起：把 app 切到后台（外屏串流由前台服务保持，不影响输出）
     */
    @ReactMethod
    public void moveToBackground() {
        UiThreadUtil.runOnUiThread(() -> {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                activity.moveTaskToBack(true);
            }
        });
    }

    /**
     * 外屏刷新率偏好：0 自动（跟随串流帧率）/ 60 / 120
     */
    @ReactMethod
    public void setRefreshRatePreference(final int hz) {
        com.peasyo.session.ExternalDisplayController.setRefreshRatePreference(hz);
    }

    /**
     * 伪息屏亮度控制：0.01 ~ 1.0，-1 恢复系统默认
     */
    @ReactMethod
    public void setScreenBrightness(final float brightness) {
        UiThreadUtil.runOnUiThread(() -> {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                return;
            }
            try {
                WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                if (brightness < 0f) {
                    lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
                } else {
                    lp.screenBrightness = Math.max(0.01f, Math.min(1.0f, brightness));
                }
                activity.getWindow().setAttributes(lp);
            } catch (Exception e) {
                // ignore
            }
        });
    }
}
