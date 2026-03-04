package com.peasyo.input;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

/**
 * 触觉发送线程：
 * - 主线程/业务线程把帧丢进队列
 * - 这个类在后台线程里取帧并调用 nativeSendHapticFeedback
 */
public final class DualSenseHapticSender {

    // 最多缓存 1000 帧
    private static final int QUEUE_CAPACITY = 1000;
    // 发送线程使用 0x400 大小的 direct buffer
    private static final int DIRECT_BUFFER_SIZE = 1024;

    private static final class HapticFrame {
        final byte[] data;
        final float gain;

        HapticFrame(byte[] data, float gain) {
            this.data = data;
            this.gain = gain;
        }
    }

    private final BlockingQueue<HapticFrame> queue = new ArrayBlockingQueue<>(QUEUE_CAPACITY, false);
    private volatile boolean running = false;
    private Thread worker;

    public synchronized void start() {
        if (running) {
            return;
        }
        running = true;
        queue.clear();

        worker = new Thread(() -> {
            ByteBuffer directBuffer = ByteBuffer.allocateDirect(DIRECT_BUFFER_SIZE).order(ByteOrder.LITTLE_ENDIAN);
            while (running) {
                try {
                    HapticFrame frame = queue.take();
                    if (frame == null || frame.data == null) {
                        continue;
                    }
                    if (frame.data.length <= 0 || frame.data.length > DIRECT_BUFFER_SIZE) {
                        continue;
                    }
                    directBuffer.clear();
                    directBuffer.put(frame.data);
                    directBuffer.flip();
                    HapticNative.nativeSendHapticFeedback(
                            directBuffer,
                            frame.data.length,
                            frame.gain
                    );
                } catch (InterruptedException ignored) {
                    break;
                }
            }
            queue.clear();
        }, "DualSense-Haptics");

        worker.setDaemon(true);
        worker.start();
    }

    public synchronized void stop() {
        running = false;
        if (worker != null) {
            worker.interrupt();
            worker = null;
        }
        queue.clear();
    }

    /**
     * 非阻塞入队；队列满时返回 false（实时场景下丢帧优于阻塞）
     */
    public boolean enqueue(byte[] frame) {
        return enqueue(frame, 0.5f);
    }

    /**
     * 非阻塞入队；队列满时返回 false（实时场景下丢帧优于阻塞）
     */
    public boolean enqueue(byte[] frame, float intensityGain) {
        if (!running || frame == null || frame.length == 0) {
            return false;
        }
        return queue.offer(new HapticFrame(frame, intensityGain));
    }
}
