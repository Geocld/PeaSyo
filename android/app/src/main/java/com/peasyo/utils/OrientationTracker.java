package com.peasyo.utils;

public class OrientationTracker {
    private static final float SIN_1_4_PI = 0.7071067811865475f;
    private static final float SIN_NEG_1_4_PI = -0.7071067811865475f;
    private static final float COS_1_4_PI = 0.7071067811865476f;
    private static final float COS_NEG_1_4_PI = 0.7071067811865476f;

    private static final int WARMUP_SAMPLES_COUNT = 60000;
    private static final float BETA_WARMUP = 90000.0f;
    private static final float BETA_DEFAULT = 90000.0f;

    private static final float ORIENT_FUZZ = 0.0007f;
    private static final float FUZZ_FILTER_PREV_WEIGHT = 0.75f;
    private static final float FUZZ_FILTER_PREV_WEIGHT2x = 0.6f;

    // 四元数状态
    private static class Orientation {
        float w, x, y, z;

        public Orientation() {
            w = 1.0f;
            x = 0.0f;
            y = 0.0f;
            z = 0.0f;
        }
    }

    private int sampleIndex = 0;  // 添加采样计数器
    private Orientation orientation = new Orientation();

    // 快速求平方根倒数
    private float invSqrt(float x) {
        return 1.0f / (float)Math.sqrt(x);
    }

    // 模糊处理函数
    private void fuzz(float value, float[] prev, float fuzz, float weight, float weight2x) {
        float diff = value - prev[0];
        if (Math.abs(diff) <= fuzz) {
            prev[0] = prev[0] * weight + value * (1.0f - weight);
        } else if (Math.abs(diff) <= fuzz * 2.0f) {
            prev[0] = prev[0] * weight2x + value * (1.0f - weight2x);
        } else {
            prev[0] = value;
        }
    }

    public float[] updateOrientation(float gx, float gy, float gz,
                                     float ax, float ay, float az,
                                     float timeStepSec) {
        // 计算当前应该使用的 beta 值
        float beta = sampleIndex < WARMUP_SAMPLES_COUNT ? BETA_WARMUP : BETA_DEFAULT;
        float q0 = orientation.w, q1 = orientation.x, q2 = orientation.y, q3 = orientation.z;
        float recipNorm;
        float s0, s1, s2, s3;
        float qDot1, qDot2, qDot3, qDot4;
        float _2q0, _2q1, _2q2, _2q3, _4q0, _4q1, _4q2, _8q1, _8q2, q0q0, q1q1, q2q2, q3q3;

        // 从陀螺仪计算四元数变化率
        qDot1 = 0.5f * (-q1 * gx - q2 * gy - q3 * gz);
        qDot2 = 0.5f * (q0 * gx + q2 * gz - q3 * gy);
        qDot3 = 0.5f * (q0 * gy - q1 * gz + q3 * gx);
        qDot4 = 0.5f * (q0 * gz + q1 * gy - q2 * gx);

        // 如果加速度计测量有效，则计算反馈
        if (!((ax == 0.0f) && (ay == 0.0f) && (az == 0.0f))) {
            // 归一化加速度计测量
            recipNorm = invSqrt(ax * ax + ay * ay + az * az);
            ax *= recipNorm;
            ay *= recipNorm;
            az *= recipNorm;

            // 辅助变量
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

            // 梯度下降算法校正步骤
            s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
            s1 = _4q1 * q3q3 - _2q3 * ax + 4.0f * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
            s2 = 4.0f * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
            s3 = 4.0f * q1q1 * q3 - _2q1 * ax + 4.0f * q2q2 * q3 - _2q2 * ay;

            recipNorm = s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3;
            if (recipNorm > 0.000001f) {
                recipNorm = invSqrt(recipNorm);
                s0 *= recipNorm;
                s1 *= recipNorm;
                s2 *= recipNorm;
                s3 *= recipNorm;

                // 应用反馈步骤
                qDot1 -= beta * s0;
                qDot2 -= beta * s1;
                qDot3 -= beta * s2;
                qDot4 -= beta * s3;
            }
        }

        // 积分得到四元数
        q0 += qDot1 * timeStepSec;
        q1 += qDot2 * timeStepSec;
        q2 += qDot3 * timeStepSec;
        q3 += qDot4 * timeStepSec;

        // 归一化四元数
        recipNorm = invSqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
        q0 *= recipNorm;
        q1 *= recipNorm;
        q2 *= recipNorm;
        q3 *= recipNorm;

        // 应用模糊处理
        float[] wPrev = {orientation.w};
        float[] xPrev = {orientation.x};
        float[] yPrev = {orientation.y};
        float[] zPrev = {orientation.z};

        fuzz(q0, wPrev, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
        fuzz(q1, xPrev, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
        fuzz(q2, yPrev, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);
        fuzz(q3, zPrev, ORIENT_FUZZ, FUZZ_FILTER_PREV_WEIGHT, FUZZ_FILTER_PREV_WEIGHT2x);

        orientation.w = wPrev[0];
        orientation.x = xPrev[0];
        orientation.y = yPrev[0];
        orientation.z = zPrev[0];

        // 更新采样计数
        sampleIndex++;

        float[] quaternion = new float[4];
        quaternion[0] = orientation.x; // 四元数的 x 分量
        quaternion[1] = orientation.y; // 四元数的 y 分量
        quaternion[2] = orientation.z; // 四元数的 z 分量
        quaternion[3] = orientation.w; // 四元数的 w 分量

        return quaternion;
    }

    // 获取当前方向四元数
    public float[] getQuaternion() {
        return new float[]{orientation.w, orientation.x, orientation.y, orientation.z};
    }
}
