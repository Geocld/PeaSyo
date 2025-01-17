package com.peasyo.registry;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import android.util.Base64;
import android.util.Log;

import com.peasyo.lib.*;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import kotlin.Unit;

public class RegistryManager extends ReactContextBaseJavaModule {
    public RegistryManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "RegistryManager";
    }

    @ReactMethod
    private void registry(int target_value, String host, boolean broadcast, String psnId, int pin, Promise promise) {
        Log.d("RegistryManager", "registry start");
        Target target = Target.fromValue(target_value);

        byte[] psnAccountId = null;

        try {
            psnAccountId = Base64.decode(psnId, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            psnAccountId = null;
        }

        RegistInfo registInfo = new RegistInfo(target, host, broadcast, null, psnAccountId, pin);

        ChiakiRxLog log = new ChiakiRxLog(ChiakiLog.Level.ALL.getValue());

        Log.d("RegistryManager", "registry registInfo" + registInfo);

        // 开始注册设备
        Regist regist = new Regist(registInfo, log.getLog(), event -> {
            // 注册回调
            Log.d("RegistryManager", "registEvent callback" + event);
            if (event instanceof RegistEventCanceled) {
                Log.d("RegistryManager", "registEvent RegistEventCanceled");
            } else if (event instanceof RegistEventFailed) {
                Log.d("RegistryManager", "registEvent RegistEventFailed");
            } else if (event instanceof RegistEventSuccess) {
                Log.d("RegistryManager", "registEvent RegistEventSuccess");
                RegistHost registHost = ((RegistEventSuccess) event).getHost();
                Log.d("RegistryManager", "registEvent registHost" + registHost);

                // TODO: registHost里的byteArray需要转为string再传会js保存
                // 将 byte[] 转为 Base64 编码字符串
                String serverMacStr = java.util.Base64.getEncoder().encodeToString(registHost.getServerMac());
                String rpRegistKeyStr = java.util.Base64.getEncoder().encodeToString(registHost.getRpRegistKey());
                String rpKeyStr = java.util.Base64.getEncoder().encodeToString(registHost.getRpKey());

                Log.d("RegistryManager", "registEvent serverMacStr" + serverMacStr);
                Log.d("RegistryManager", "registEvent rpRegistKeyStr" + rpRegistKeyStr);
                Log.d("RegistryManager", "registEvent rpKeyStr" + rpKeyStr);

                // 将 Base64 字符串还原为 byte[]
//                byte[] serverMac = java.util.Base64.getDecoder().decode(serverMacStr);
//                Log.d("RegistryManager", "registEvent serverMac" + new String(serverMac));

                WritableMap params = Arguments.createMap();
                params.putString("apSsid", registHost.getApSsid());
                params.putString("apBssid", registHost.getApBssid());
                params.putString("apKey", registHost.getApKey());
                params.putString("apName", registHost.getApName());
                params.putString("serverMac", serverMacStr);
                params.putString("serverNickname", registHost.getServerNickname());
                params.putString("rpRegistKey", rpRegistKeyStr);
                params.putString("rpKey", rpKeyStr);
                promise.resolve(params);
            }
            return Unit.INSTANCE;
        });
    }

    @ReactMethod(isBlockingSynchronousMethod=true)
    private String getCredential(String registKeyStr) {
        byte[] registKey = java.util.Base64.getDecoder().decode(registKeyStr);
        int end = -1;
        for (int i = 0; i < registKey.length; i++) {
            if (registKey[i] == 0) {
                end = i;
                break;
            }
        }

        byte[] subArray = Arrays.copyOfRange(registKey, 0,
                end >= 0 ? end : registKey.length);
        String registKeyString = new String(subArray, StandardCharsets.UTF_8);

        long userCredential;
        try {
            userCredential = Long.parseUnsignedLong(registKeyString, 16);
        } catch (NumberFormatException e) {
            Log.e("RegistryManager", "Failed to convert registKey to int", e);
            return "";
        }
        Log.d("RegistryManager", "userCredential:" + userCredential);
        return Long.toString(userCredential);
    }
}
