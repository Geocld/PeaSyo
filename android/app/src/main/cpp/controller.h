// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#ifndef CHIAKI_JNI_CONTROLLER_H
#define CHIAKI_JNI_CONTROLLER_H

#include <chiaki/controller.h>
#include <chiaki/orientation.h>

typedef struct android_chiaki_controller_t
{
    ChiakiOrientationTracker orientation_tracker;
    ChiakiControllerState state;
    ChiakiAccelNewZero accel_zero;
    ChiakiAccelNewZero real_accel;
} AndroidChiakiController;

void android_chiaki_controller_init(AndroidChiakiController *controller);
void android_chiaki_sensor_update(AndroidChiakiController *controller, float accel_x, float accel_y, float accel_z, float gyro_x, float gyro_y, float gyro_z);


#endif // CHIAKI_JNI_CONTROLLER_H