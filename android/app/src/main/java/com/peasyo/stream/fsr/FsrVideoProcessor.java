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

    public FsrVideoProcessor(Context context) {
        this.context = context.getApplicationContext();
    }

    @Override
    public void initialize(int glMajorVersion, int glMinorVersion, String extensions) {
        // 在多数 Android 设备上，OpenGL context 实际运行在 GLES 2/3 的兼容模式，
        // 使用 3.x shader 会因为 #version 310 / textureGather 等特性报错。
        // 因此默认强制使用 2.0 版本的 FSR shader，兼容性最佳。
        String shaderDir = "shaders/fsr/mobile/2.0/";
        needInputSize = true;
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
            if (frameWidth > 0 && frameHeight > 0) {
                inputTextureSize = new float[]{frameWidth * 4, frameHeight * 4};
            } else {
                inputTextureSize = new float[]{0f, 0f};
            }
        }

        try {
            currentProgram.setSamplerTexIdUniform("inputTexture", frameTexture, 0);
            if (inputTextureSize != null) {
                currentProgram.setFloatsUniform("inputTextureSize", inputTextureSize);
            }
            currentProgram.setFloatsUniform("outputTextureSize", outputSize);
            currentProgram.setFloatsUniform("uTexTransform", transformMatrix);
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
}
