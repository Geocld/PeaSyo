package com.peasyo.input;

public interface UsbDriverListener {
    void reportControllerState(int controllerId, int buttonFlags,
                               float leftStickX, float leftStickY,
                               float rightStickX, float rightStickY,
                               float leftTrigger, float rightTrigger);

    void reportDsControllerState(int controllerId, int buttonFlags,
                               float leftStickX, float leftStickY,
                               float rightStickX, float rightStickY,
                               float leftTrigger, float rightTrigger,
                               int gyrox, int gyroy, int gyroz,
                               int accelx, int accely, int accelz,
                                 int touch0id, int touch0x, int touch0y,
                                 int touch1id, int touch1x, int touch1y);

    void deviceRemoved(AbstractController controller);
    void deviceAdded(AbstractController controller);
}
