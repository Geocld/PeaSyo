package com.peasyo.input;

public class DSControllerPacket {
    // D-pad flags
    public static final int DPAD_UP_FLAG = (1 << 0);
    public static final int DPAD_DOWN_FLAG = (1 << 1);
    public static final int DPAD_LEFT_FLAG = (1 << 2);
    public static final int DPAD_RIGHT_FLAG = (1 << 3);

    // Face buttons flags
    public static final int SQUARE_FLAG = (1 << 4);
    public static final int CROSS_FLAG = (1 << 5);
    public static final int CIRCLE_FLAG = (1 << 6);
    public static final int TRIANGLE_FLAG = (1 << 7);

    // Shoulder buttons and triggers flags
    public static final int L1_FLAG = (1 << 8);
    public static final int R1_FLAG = (1 << 9);

    // Thumb stick click flags
    public static final int L3_FLAG = (1 << 10);
    public static final int R3_FLAG = (1 << 11);

    // Special buttons flags
    public static final int CREATE_FLAG = (1 << 12);
    public static final int OPTIONS_FLAG = (1 << 13);
    public static final int PS_FLAG = (1 << 14);
    public static final int TOUCHPAD_FLAG = (1 << 15);
    public static final int MUTE_FLAG = (1 << 16);
}
