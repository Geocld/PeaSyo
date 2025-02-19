package com.peasyo.utils;

// Refer: https://github.com/streetpea/chiaki-ng/blob/main/lib/src/orientation.c
public class OrientationTracker {
    private static final float SIN_1_4_PI = 0.7071067811865475f;
    private static final float SIN_NEG_1_4_PI = -0.7071067811865475f;
    private static final float COS_1_4_PI = 0.7071067811865476f;
    private static final float COS_NEG_1_4_PI = -0.7071067811865476f;

    private static final int WARMUP_SAMPLES_COUNT = 60000;
    private static final float BETA_WARMUP = 90000.0f;
    private static final float BETA_DEFAULT = 90000.0f;

    private static final float ORIENT_FUZZ = 0.0007f;
    private static final float FUZZ_FILTER_PREV_WEIGHT = 0.75f;
    private static final float FUZZ_FILTER_PREV_WEIGHT2x = 0.6f;

    private float accelX, accelY, accelZ;
    private float gyroX, gyroY, gyroZ;
    private Orientation orient;
    private long timestamp;
    private int sampleIndex;

    public OrientationTracker() {
        accelX = 0.0f;
        accelY = 1.0f;
        accelZ = 0.0f;
        gyroX = gyroY = gyroZ = 0.0f;
        orient = new Orientation();
        timestamp = 0;
        sampleIndex = 0;
    }

    public float[] update(float gx, float gy, float gz, float ax, float ay, float az,
                          AccelNewZero accelZero, boolean accelZeroApplied, long timestampUs) {
        gyroX = gx;
        gyroY = gy;
        gyroZ = gz;
        if (!accelZeroApplied) {
            ax -= accelZero.accelX;
            ay -= accelZero.accelY;
            az -= accelZero.accelZ;
        }
        accelX = ax;
        accelY = ay;
        accelZ = az;
        sampleIndex++;
        if (sampleIndex <= 1) {
            timestamp = timestampUs;
            return new float[]{orient.w, orient.x, orient.y, orient.z};
        }
        long deltaUs = timestampUs;
        if (deltaUs < timestamp) {
            deltaUs += (1L << 32);
        }
        deltaUs -= timestamp;
        timestamp = timestampUs;
        orient.update(gx, gy, gz, ax, ay, az,
                sampleIndex <WARMUP_SAMPLES_COUNT ? BETA_WARMUP : BETA_DEFAULT,
                (float) deltaUs / 1000000.0f);

        float orientW = COS_NEG_1_4_PI * orient.w - SIN_NEG_1_4_PI * orient.x;
        float orientX = COS_NEG_1_4_PI * orient.x + SIN_NEG_1_4_PI * orient.w;
        float orientY = COS_NEG_1_4_PI * orient.y - SIN_NEG_1_4_PI * orient.z;
        float orientZ = COS_NEG_1_4_PI * orient.z + SIN_NEG_1_4_PI * orient.y;

        return new float[]{orientW, orientX, orientY, orientZ};
    }

    private static class Orientation {
        float x, y, z, w;

        public Orientation() {
            // 90 deg rotation around x for Madgwick
            x = SIN_1_4_PI;
            y = 0.0f;
            z = 0.0f;
            w = COS_1_4_PI;
        }

        public void update(float gx, float gy, float gz, float ax, float ay, float az, float beta, float timeStepSec) {
            float q0 = w, q1 = x, q2 = y, q3 = z;
            // Madgwick's IMU algorithm.
            // See: http://www.x-io.co.uk/node/8#open_source_ahrs_and_imu_algorithms
            float recipNorm;
            float s0, s1, s2, s3;
            float qDot1, qDot2, qDot3, qDot4;
            float _2q0, _2q1, _2q2, _2q3, _4q0, _4q1, _4q2, _8q1, _8q2, q0q0, q1q1, q2q2, q3q3;

            // Rate of change of quaternion from gyroscope
            qDot1 = 0.5f * (-q1 * gx - q2 * gy - q3 * gz);
            qDot2 = 0.5f * (q0 * gx + q2 * gz - q3 * gy);
            qDot3 = 0.5f * (q0 * gy - q1 * gz + q3 * gx);
            qDot4 = 0.5f * (q0 * gz + q1 * gy - q2 * gx);

            // Compute feedback only if accelerometer measurement valid
            if (!((ax == 0.0f) && (ay == 0.0f) && (az == 0.0f))) {
                // Normalise accelerometer measurement
                recipNorm = invSqrt(ax * ax + ay * ay + az * az);
                ax *= recipNorm;
                ay *= recipNorm;
                az *= recipNorm;

                // Auxiliary variables to avoid repeated arithmetic
                _2q0 = 2.0f * q0;
                _2q1 = 2.0f * q1;
                _2q2 = 2.0f * q2;
                _2q3 = 2.0f * q3;
                _4q0 = 4.0f * q0;
                _4q1 = 4.0f * q1;
                _4q2 = 4.0f * q2;
                _8q1 = 8.0f * q1;
                _8q2 = 8.0f * q2;
                q0q0 = q0 * q0;
                q1q1 = q1 * q1;
                q2q2 = q2 * q2;
                q3q3 = q3 * q3;

                // Gradient decent algorithm corrective step
                s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
                s1 = _4q1 * q3q3 - _2q3 * ax + 4.0f * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
                s2 = 4.0f * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
                s3 = 4.0f * q1q1 * q3 - _2q1 * ax + 4.0f * q2q2 * q3 - _2q2 * ay;
                recipNorm = s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3; // normalise step magnitude
                // avoid NaN when the orientation is already perfect or inverse to perfect
                if (recipNorm > 0.000001f) {
                    recipNorm = invSqrt(recipNorm);
                    s0 *= recipNorm;
                    s1 *= recipNorm;
                    s2 *= recipNorm;
                    s3 *= recipNorm;

                    // Apply feedback step
                    qDot1 -= beta * s0;
                    qDot2 -= beta * s1;
                    qDot3 -= beta * s2;
                    qDot4 -= beta * s3;
                }
            }

            // Integrate rate of change of quaternion to yield quaternion
            q0 += qDot1 * timeStepSec;
            q1 += qDot2 * timeStepSec;
            q2 += qDot3 * timeStepSec;
            q3 += qDot4 * timeStepSec;

            // Normalise quaternion
            recipNorm = invSqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
            q0 *= recipNorm;
            q1 *= recipNorm;
            q2 *= recipNorm;
            q3 *= recipNorm;

            w = fuzz(q0, w, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
            x = fuzz(q1, x, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
            y = fuzz(q2, y, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
            z = fuzz(q3, z, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
        }

        private float fuzz(float cur, float prev, float fuzz, float wprev, float wprev2x) {
            if ((cur < prev + fuzz / 2) && (cur > prev - fuzz / 2))
                return prev;
            if ((cur < prev + fuzz) && (cur > prev - fuzz))
                return (wprev * prev + (1 - wprev) * cur);
            if ((cur < prev + fuzz * 2) && (cur > prev - fuzz * 2))
                return (wprev2x * prev + (1 - wprev2x) * cur);
            return cur;
        }

        private float invSqrt(float x) {
            return 1.0f / (float) Math.sqrt(x);
        }
    }

    public static class AccelNewZero {
        public float accelX, accelY, accelZ;

        public void setInactive(boolean realAccel) {
            accelX = 0.0f;
            accelY = realAccel ? 1.0f : 0.0f;
            accelZ = 0.0f;
        }

        public void setActive(float accelX, float accelY, float accelZ, boolean realAccel) {
            this.accelX = accelX;
            this.accelY = realAccel ? accelY : accelY - 1.0f;
            this.accelZ = accelZ;
        }
    }
}