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
    private static final String TAG = "RazerKishiDebug";

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
            Log.d(TAG, "Sender already running");
            return;
        }
        this.endpoint = endpoint;
        running = true;
        queue.clear();

        Log.i(TAG, "Starting haptic sender thread");

        worker = new Thread(() -> {
            int framesSent = 0;
            int framesFailed = 0;
            boolean firstFrame = true;

            while (running) {
                try {
                    byte[] frame = queue.take();
                    if (frame == null || frame.length == 0) {
                        continue;
                    }

                    if (firstFrame) {
                        Log.i(TAG, "Sending first frame - length: " + frame.length +
                                   ", endpoint address: 0x" + Integer.toHexString(endpoint.getAddress()) +
                                   ", endpoint maxPacketSize: " + endpoint.getMaxPacketSize());
                        firstFrame = false;
                    }

                    // 使用 bulkTransfer 发送到 INTERRUPT OUT 端点
                    int result = connection.bulkTransfer(endpoint, frame, frame.length, TRANSFER_TIMEOUT_MS);
                    if (result < 0) {
                        framesFailed++;
                        if (framesFailed <= 5) {
                            Log.e(TAG, "Frame transfer failed: result=" + result +
                                       ", frame.length=" + frame.length +
                                       ", endpoint.maxPacketSize=" + endpoint.getMaxPacketSize());
                        } else if (framesFailed % 100 == 0) {
                            Log.w(TAG, "Frame transfer failed: " + result + " (total failed: " + framesFailed + ")");
                        }
                    } else {
                        framesSent++;
                        if (framesSent == 1) {
                            Log.i(TAG, "First frame sent successfully! result=" + result);
                        } else if (framesSent % 100 == 0) {
                            Log.d(TAG, "Sent " + framesSent + " frames successfully");
                        }
                    }
                } catch (InterruptedException ignored) {
                    break;
                }
            }
            queue.clear();
            Log.i(TAG, "Haptic sender stopped. Total sent: " + framesSent + ", failed: " + framesFailed);
        }, "RazerKishi-Haptics");

        worker.setDaemon(true);
        worker.start();
        Log.i(TAG, "Haptic sender thread started");
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
