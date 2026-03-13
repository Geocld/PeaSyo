package com.peasyo.input;

import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.util.Log;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

/**
 * Razer Kishi 触觉发送线程
 * - 主线程把帧丢进队列
 * - 后台线程取帧并通过 bulkTransfer 发送到 INTERRUPT OUT 端点
 */
public final class RazerKishiHapticSender {
    private static final String TAG = "RazerKishiHapticSender";

    // 最多缓存 1000 帧
    private static final int QUEUE_CAPACITY = 1000;
    private static final int TRANSFER_TIMEOUT_MS = 100;

    private final UsbDeviceConnection connection;
    private final BlockingQueue<byte[]> queue = new ArrayBlockingQueue<>(QUEUE_CAPACITY, false);
    private volatile boolean running = false;
    private Thread worker;
    private UsbEndpoint endpoint;

    public RazerKishiHapticSender(UsbDeviceConnection connection) {
        this.connection = connection;
    }

    public synchronized void start(UsbEndpoint endpoint) {
        if (running) {
            return;
        }
        this.endpoint = endpoint;
        running = true;
        queue.clear();

        worker = new Thread(() -> {
            while (running) {
                try {
                    byte[] frame = queue.take();
                    if (frame == null || frame.length == 0) {
                        continue;
                    }

                    // 使用 bulkTransfer 发送到 INTERRUPT OUT 端点
                    int result = connection.bulkTransfer(endpoint, frame, frame.length, TRANSFER_TIMEOUT_MS);
                    if (result < 0) {
                        Log.w(TAG, "Haptic frame transfer failed: " + result);
                    }
                } catch (InterruptedException ignored) {
                    break;
                }
            }
            queue.clear();
        }, "RazerKishi-Haptics");

        worker.setDaemon(true);
        worker.start();
        Log.d(TAG, "Haptic sender started");
    }

    public synchronized void stop() {
        running = false;
        if (worker != null) {
            worker.interrupt();
            worker = null;
        }
        queue.clear();
        Log.d(TAG, "Haptic sender stopped");
    }

    /**
     * 非阻塞入队；队列满时返回 false（实时场景下丢帧优于阻塞）
     */
    public boolean enqueue(byte[] frame) {
        if (!running || frame == null || frame.length == 0) {
            return false;
        }
        return queue.offer(frame);
    }
}
