package com.peasyo.input;

import java.nio.ByteBuffer;

/**
 * DualSense 触觉反馈的 JNI 桥接类。
 * 这里的方法由 Java 层调用，实际发送逻辑在 native 的 haptic_usb.cpp。
 */
public final class HapticNative {

    static {
        // 复用已有的 chiaki-jni 动态库
        System.loadLibrary("chiaki-jni");
    }

    private HapticNative() {
    }

    /**
     * 连接触觉端点（ioctl 路径）
     *
     * @param fd Android UsbDeviceConnection 的文件描述符
     * @param ifaceId 音频接口 ID
     * @param altSetting 音频接口 alt setting
     * @param epAddr 触觉等时 OUT 端点地址
     */
    public static native boolean nativeConnectHaptics(int fd, int ifaceId, int altSetting, byte epAddr);

    /**
     * 启用触觉发送（会分配并初始化 native 缓冲区）
     */
    public static native boolean nativeEnableHaptics();

    /**
     * 发送一帧原始触觉数据
     *
     * @param buffer DirectByteBuffer
     * @param length 有效字节长度
     */
    public static native boolean nativeSendHapticFeedback(ByteBuffer buffer, int length);

    /**
     * 清理 native 资源
     */
    public static native void nativeCleanupHaptics();
}
