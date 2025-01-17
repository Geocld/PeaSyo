package com.peasyo.input;

public class ControllerPacket {
    public static final int A_FLAG = (1 << 0);
    public static final int B_FLAG = (1 << 1);
    public static final int X_FLAG = (1 << 2);
    public static final int Y_FLAG = (1 << 3);
    public static final int UP_FLAG = (1 << 6);
    public static final int DOWN_FLAG = (1 << 7);
    public static final int LEFT_FLAG = (1 << 4);
    public static final int RIGHT_FLAG = (1 << 5);
    public static final int LB_FLAG = (1 << 8);
    public static final int RB_FLAG = (1 << 9);
    public static final int PLAY_FLAG = (1 << 12);
    public static final int BACK_FLAG = (1 << 13);
    public static final int LS_CLK_FLAG = (1 << 10);
    public static final int RS_CLK_FLAG = (1 << 11);
    public static final int SPECIAL_BUTTON_FLAG = (1 << 15);

}