package com.peasyo;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Rational;
import android.app.PictureInPictureParams;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

public class PipManager extends ReactContextBaseJavaModule {

    ReactApplicationContext reactApplicationContext;

    public PipManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactApplicationContext = reactContext;
    }

    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "PipManager";
    }

    private boolean supportsPiPMode(Activity activity) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE);
    }

    @ReactMethod
    public void enterPipMode() {
        Activity activity = reactApplicationContext.getCurrentActivity();
        if (activity == null) {
            return;
        }

        if (!supportsPiPMode(activity)) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                Rational aspectRatio = new Rational(16, 9);
                builder.setAspectRatio(aspectRatio);
                activity.enterPictureInPictureMode(builder.build());
            } catch (IllegalStateException e) {}
        }
    }
}
