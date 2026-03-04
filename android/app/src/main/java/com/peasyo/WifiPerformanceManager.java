package com.peasyo;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Log;

/**
 * WiFi 性能模式管理器
 * 通过申请 WifiLock 来提升 WiFi 性能，降低延迟
 */
public class WifiPerformanceManager {
    private static final String TAG = "WifiPerformanceManager";

    // WifiLock 标签
    private static final String WIFI_LOCK_TAG = "peasyo";
    private static final String WIFI_LOCK_LOW_LATENCY_TAG = "peasyo_lowlatency";

    // WifiLock 实例
    private WifiManager.WifiLock wifiLock;
    private WifiManager.WifiLock wifiLockLowLatency;

    private final Context context;
    private boolean isAcquired = false;

    public WifiPerformanceManager(Context context) {
        this.context = context;
    }

    /**
     * 申请 WiFi 性能锁
     * 会申请两种锁：
     * 1. WIFI_MODE_FULL_HIGH_PERF (3) - 高性能模式
     * 2. WIFI_MODE_FULL_LOW_LATENCY (4) - 低延迟模式（仅 Android 10+）
     */
    public void acquire() {
        if (isAcquired) {
            Log.d(TAG, "WifiLock already acquired");
            return;
        }

        try {
            WifiManager wifiManager = (WifiManager) context.getApplicationContext()
                    .getSystemService(Context.WIFI_SERVICE);

            if (wifiManager == null) {
                Log.e(TAG, "WifiManager is null");
                return;
            }

            // 申请高性能 WifiLock (WIFI_MODE_FULL_HIGH_PERF = 3)
            wifiLock = wifiManager.createWifiLock(
                    WifiManager.WIFI_MODE_FULL_HIGH_PERF,
                    WIFI_LOCK_TAG
            );
            wifiLock.setReferenceCounted(false);
            wifiLock.acquire();
            Log.d(TAG, "WifiLock (HIGH_PERF) acquired");

            // Android 10+ 申请低延迟 WifiLock (WIFI_MODE_FULL_LOW_LATENCY = 4)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                wifiLockLowLatency = wifiManager.createWifiLock(
                        WifiManager.WIFI_MODE_FULL_LOW_LATENCY,
                        WIFI_LOCK_LOW_LATENCY_TAG
                );
                wifiLockLowLatency.setReferenceCounted(false);
                wifiLockLowLatency.acquire();
                Log.d(TAG, "WifiLock (LOW_LATENCY) acquired");
            }

            isAcquired = true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to acquire WifiLock", e);
        }
    }

    /**
     * 释放 WiFi 性能锁
     */
    public void release() {
        if (!isAcquired) {
            Log.d(TAG, "WifiLock not acquired, nothing to release");
            return;
        }

        try {
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
                Log.d(TAG, "WifiLock (HIGH_PERF) released");
            }

            if (wifiLockLowLatency != null && wifiLockLowLatency.isHeld()) {
                wifiLockLowLatency.release();
                Log.d(TAG, "WifiLock (LOW_LATENCY) released");
            }

            isAcquired = false;
        } catch (Exception e) {
            Log.e(TAG, "Failed to release WifiLock", e);
        }
    }

    /**
     * 检查是否已申请锁
     */
    public boolean isAcquired() {
        return isAcquired;
    }
}
