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

    @ReactMethod(isBlockingSynchronousMethod=true)
    private String getPsnDuid(String token, Boolean isPs5, String nickName) {
        RemotePsnDuid remote = new RemotePsnDuid(token, isPs5, nickName);
        String duid = remote.getDeviceUid();
        return duid;
    }

    @ReactMethod(isBlockingSynchronousMethod=true)
    private String connectPsn(String token, Boolean isPs5, String duid) {
        PsnConnect connect = new PsnConnect(token, isPs5, duid);
        return "";
    }
}
