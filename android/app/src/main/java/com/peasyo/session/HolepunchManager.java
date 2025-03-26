package com.peasyo.session;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.peasyo.lib.*;

public class HolepunchManager extends ReactContextBaseJavaModule {
    public HolepunchManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "HolepunchManager";
    }

    @ReactMethod(isBlockingSynchronousMethod=true)
    private String getDeviceUid() {
        RemotePsn remote = new RemotePsn();
        String duid = remote.getDeviceUid();
        return duid;
    }
}
