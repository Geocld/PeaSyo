#include "controller.h"
#include <chiaki/log.h>
#include <chiaki/time.h>

void android_chiaki_controller_init(AndroidChiakiController *controller) {
    chiaki_orientation_tracker_init(&controller->orientation_tracker);
    chiaki_accel_new_zero_set_inactive(&controller->accel_zero, false);
    chiaki_accel_new_zero_set_inactive(&controller->real_accel, true);
    chiaki_controller_state_set_idle(&controller->state);
}

void android_chiaki_sensor_update(AndroidChiakiController *controller, float accel_x, float accel_y, float accel_z, float gyro_x, float gyro_y, float gyro_z) {
    uint64_t timestamp = chiaki_time_now_monotonic_us();
    chiaki_accel_new_zero_set_active(&controller->real_accel,
                                     accel_x, accel_y, accel_z, true);
    chiaki_orientation_tracker_update(
            &controller->orientation_tracker, controller->state.gyro_x, controller->state.gyro_y, controller->state.gyro_z,
            accel_x, accel_y, accel_z, &controller->accel_zero, false, timestamp);

    chiaki_orientation_tracker_apply_to_controller_state(&controller->orientation_tracker, &controller->state);
}