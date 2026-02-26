package com.peasyo.stream.fsr;

import android.content.Context;
import android.opengl.GLES20;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.media3.common.util.GlProgram;
import androidx.media3.common.util.GlUtil;
import androidx.media3.common.util.GlUtil.GlException;
import androidx.media3.common.util.UnstableApi;

import java.io.IOException;

/**
 * 根据 OpenPs 的 FsrMobileVideoProcessor 改写，使用单个 shader 完成 EASU+RCAS。
 */
@UnstableApi
public class FsrVideoProcessor implements VideoProcessingGLSurfaceView.VideoProcessor {

    private static final String TAG = "FsrVideoProcessor";

    private final Context context;
    private boolean needInputSize = true;
    @Nullable
    private GlProgram program;
    private final float[] outputSize = new float[2];
    private final float[] inputSize = new float[2];
    private final float[] overriddenOutputSize = new float[2];
    private boolean lastInputLogged;
    private boolean hdrToneMapping;
    private boolean manualSharpness;
    private float manualSharpnessValue = 1.2f;
    private boolean outputSizeOverridden;

    public FsrVideoProcessor(Context context) {
        this.context = context.getApplicationContext();
    }

    @Override
    public void initialize(int glMajorVersion, int glMinorVersion, String extensions) {
        // 在多数 Android 设备上，OpenGL context 实际运行在 GLES 2/3 的兼容模式，
        // 使用 3.x shader 会因为 #version 310 / textureGather 等特性报错。
        // 因此默认强制使用 2.0 版本的 FSR shader，兼容性最佳。
        String shaderDir = "fsr/2.0/";
        Log.i(TAG, "FSR shader dir: " + shaderDir);
        Log.i(TAG, "OpenGL extensions: " + extensions);

        try {
            program = new GlProgram(
                    context,
                    shaderDir + "opt_fsr_vertex.glsl",
                    shaderDir + "opt_fsr_fragment.glsl"
            );
            program.setBufferAttribute(
                    "aPosition",
                    GlUtil.getNormalizedCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            program.setBufferAttribute(
                    "aTexCoords",
                    GlUtil.getTextureCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
        } catch (GlException e) {
            Log.e(TAG, "Failed to initialize FSR shader", e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_REPEAT);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_REPEAT);
    }

    @Override
    public void setSurfaceSize(int width, int height) {
        outputSize[0] = width;
        outputSize[1] = height;
        Log.i(TAG, "setSurfaceSize(" + width + "," + height + ")");
    }

    @Override
    public void draw(int frameTexture,
                     long frameTimestampUs,
                     int frameWidth,
                     int frameHeight,
                     float[] transformMatrix) {
        GlProgram currentProgram = program;
        if (currentProgram == null) {
            return;
        }
        float[] inputTextureSize = null;
        if (needInputSize) {
            inputTextureSize = updateInputSize(frameWidth, frameHeight, transformMatrix);
        }
        float[] resolvedOutputSize = resolveOutputSize();

        try {
            currentProgram.setSamplerTexIdUniform("inputTexture", frameTexture, 0);
            if (inputTextureSize != null) {
                currentProgram.setFloatsUniform("inputTextureSize", inputTextureSize);
            }
            currentProgram.setFloatsUniform("outputTextureSize", resolvedOutputSize);
            currentProgram.setFloatsUniform("uTexTransform", transformMatrix);
            currentProgram.setFloatUniform("uHdrToneMap", hdrToneMapping ? 1f : 0f);
            currentProgram.setFloatUniform("sharpness", resolveSharpness(inputTextureSize, resolvedOutputSize));
            currentProgram.bindAttributesAndUniforms();
            Log.v(TAG, "FSR draw frame tex=" + frameTexture + " size=" + frameWidth + "x" + frameHeight);
        } catch (GlException e) {
            Log.e(TAG, "Failed to bind fsr shader program", e);
        }

        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("FSR draw failed");
    }

    @Override
    public void release() {
        if (program != null) {
            try {
                program.delete();
            } catch (GlException e) {
                Log.e(TAG, "Failed to delete FSR shader program", e);
            }
            program = null;
        }
    }

    private void checkGlError(String message) {
        try {
            GlUtil.checkGlError();
        } catch (GlException e) {
            Log.e(TAG, message, e);
        }
    }

    public void setHdrToneMappingEnabled(boolean enabled) {
        hdrToneMapping = enabled;
    }

    public void setSharpness(float value) {
        manualSharpness = true;
        manualSharpnessValue = Math.max(0f, Math.min(2f, value));
    }

    public void resetSharpness() {
        manualSharpness = false;
    }

    /**
     * 手动覆盖输出纹理尺寸（单位：像素），用于强制 shader 按目标分辨率进行采样。
     * 传入 <=0 会恢复跟随 Surface 大小。
     */
    public void setOutputSizeOverride(int width, int height) {
        if (width > 0 && height > 0) {
            outputSizeOverridden = true;
            overriddenOutputSize[0] = width;
            overriddenOutputSize[1] = height;
            Log.i(TAG, "Override FSR output size -> " + width + "x" + height);
        } else {
            outputSizeOverridden = false;
            Log.i(TAG, "Reset FSR output size override");
        }
    }

    private float[] resolveOutputSize() {
        return outputSizeOverridden ? overriddenOutputSize : outputSize;
    }

    private float[] updateInputSize(int frameWidth, int frameHeight, float[] transformMatrix) {
        if (frameWidth <= 0 || frameHeight <= 0) {
            inputSize[0] = 0f;
            inputSize[1] = 0f;
            return inputSize;
        }
        float scaleX = 1f;
        float scaleY = 1f;
        if (transformMatrix != null && transformMatrix.length >= 16) {
            scaleX = (float) Math.hypot(transformMatrix[0], transformMatrix[1]);
            scaleY = (float) Math.hypot(transformMatrix[4], transformMatrix[5]);
            if (scaleX == 0f) {
                scaleX = 1f;
            }
            if (scaleY == 0f) {
                scaleY = 1f;
            }
        }
        inputSize[0] = frameWidth / scaleX;
        inputSize[1] = frameHeight / scaleY;
        if (!lastInputLogged && (scaleX != 1f || scaleY != 1f)) {
            Log.i(TAG, "SurfaceTexture transform scale -> x:" + scaleX + " y:" + scaleY +
                    ", effective input size:" + inputSize[0] + "x" + inputSize[1]);
            lastInputLogged = true;
        }
        return inputSize;
    }

    private float resolveSharpness(@Nullable float[] sourceSize, float[] resolvedOutputSize) {
        if (manualSharpness) {
            return manualSharpnessValue;
        }
        if (sourceSize == null || sourceSize[0] <= 0f || sourceSize[1] <= 0f) {
            return 1.2f;
        }
        float scaleX = resolvedOutputSize[0] > 0 ? resolvedOutputSize[0] / sourceSize[0] : 1f;
        float scaleY = resolvedOutputSize[1] > 0 ? resolvedOutputSize[1] / sourceSize[1] : 1f;
        float scale = Math.max(scaleX, scaleY);
        float boost = Math.min(Math.max(scale - 1f, 0f), 1.5f);
        return Math.min(2f, 1.0f + boost * 0.6f);
    }
}
