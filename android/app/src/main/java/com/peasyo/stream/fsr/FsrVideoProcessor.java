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

@UnstableApi
public class FsrVideoProcessor implements VideoProcessingGLSurfaceView.VideoProcessor {

    private static final String TAG = "FsrVideoProcessor";

    private final Context context;

    private boolean needInputSize = true;
    private final int[] framebuffers = new int[1];
    private final int[] textures = new int[1];

    @Nullable
    private GlProgram easuProgram;
    @Nullable
    private GlProgram rcasProgram;

    private float sharpness = 0.2f;
    private boolean fsrEnabled = true;
    private boolean hdrToneMappingEnabled;

    private int outputWidth = -1;
    private int outputHeight = -1;
    private float[] outputSize = new float[2];

    public FsrVideoProcessor(Context context) {
        this.context = context.getApplicationContext();
    }

    @Override
    public void initialize(int glMajorVersion, int glMinorVersion, String extensions) {
        String shaderDir = "fsr/2.0/";
        needInputSize = true;
        boolean supportsExternalOesEssl3 = extensions != null
                && extensions.contains("GL_OES_EGL_image_external_essl3");
//        if (supportsExternalOesEssl3) {
//            if (glMajorVersion > 3 || (glMajorVersion == 3 && glMinorVersion >= 1)) {
//                shaderDir = "fsr/3.1/";
//                needInputSize = false;
//            } else if (glMajorVersion == 3 && glMinorVersion == 0) {
//                shaderDir = "fsr/3.0/";
//                needInputSize = false;
//            }
//        } else if (glMajorVersion >= 3) {
//            Log.w(TAG, "GLES3 context without GL_OES_EGL_image_external_essl3, force FSR 2.0 shaders");
//        }

        Log.i(TAG, "FSR shader dir: " + shaderDir);
        Log.i(TAG, "OpenGL extensions: " + extensions);

        if (!createPrograms(shaderDir) && !"fsr/2.0/".equals(shaderDir)) {
            Log.w(TAG, "Fallback to GLES2 shader set because selected shader failed: " + shaderDir);
            needInputSize = true;
            createPrograms("fsr/2.0/");
        }

        // Keep texture parameters aligned with TvBox FsrVideoProcessor implementation.
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_REPEAT);
        GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_REPEAT);
    }

    @Override
    public void setSurfaceSize(int width, int height) {
        if (width <= 0 || height <= 0) {
            return;
        }
        if (outputWidth == width && outputHeight == height) {
            return;
        }
        Log.i(TAG, "setSurfaceSize(" + width + "," + height + ")");
        outputWidth = width;
        outputHeight = height;
        outputSize = new float[]{width, height};
        deleteFramebuffer();
        createFramebuffer();
    }

    @Override
    public void draw(int frameTexture,
                     long frameTimestampUs,
                     int frameWidth,
                     int frameHeight,
                     float[] transformMatrix) {
        if (!fsrEnabled) {
            drawPassthrough(frameTexture, transformMatrix);
            return;
        }

        GlProgram easu = easuProgram;
        GlProgram rcas = rcasProgram;
        if (easu == null || rcas == null) {
            drawPassthrough(frameTexture, transformMatrix);
            return;
        }
        if (outputWidth <= 0 || outputHeight <= 0) {
            drawPassthrough(frameTexture, transformMatrix);
            return;
        }
        if (framebuffers[0] == 0 || textures[0] == 0) {
            createFramebuffer();
            if (framebuffers[0] == 0 || textures[0] == 0) {
                drawPassthrough(frameTexture, transformMatrix);
                return;
            }
        }

        float[] inputTextureSize = null;
        if (needInputSize) {
            if (frameWidth > 0 && frameHeight > 0) {
                inputTextureSize = new float[]{frameWidth, frameHeight};
            } else {
                inputTextureSize = new float[]{0f, 0f};
            }
        }

        GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, framebuffers[0]);
        try {
            easu.setSamplerTexIdUniform("inputTexture", frameTexture, 0);
            if (inputTextureSize != null) {
                easu.setFloatsUniform("inputTextureSize", inputTextureSize);
            }
            easu.setFloatsUniform("outputTextureSize", outputSize);
            easu.setFloatsUniform("uTexTransform", transformMatrix);
            easu.bindAttributesAndUniforms();
        } catch (GlException e) {
            Log.e(TAG, "Failed to bind EASU shader program", e);
            GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0);
            return;
        }
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("Failed to EASU draw");

        GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0);
        try {
            rcas.setSamplerTexIdUniform("inputTexture", textures[0], 0);
            if (needInputSize) {
                rcas.setFloatsUniform("inputTextureSize", outputSize);
            }
            rcas.setFloatUniform("sharpness", sharpness);
            rcas.bindAttributesAndUniforms();
        } catch (GlException e) {
            Log.e(TAG, "Failed to bind RCAS shader program", e);
            return;
        }
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("Failed to RCAS draw");
    }

    @Override
    public void release() {
        try {
            if (easuProgram != null) {
                easuProgram.delete();
                easuProgram = null;
            }
        } catch (GlException e) {
            Log.e(TAG, "Failed to delete EASU shader program", e);
        }

        try {
            if (rcasProgram != null) {
                rcasProgram.delete();
                rcasProgram = null;
            }
        } catch (GlException e) {
            Log.e(TAG, "Failed to delete RCAS shader program", e);
        }

        try {
            if (passthroughProgram != null) {
                passthroughProgram.delete();
                passthroughProgram = null;
            }
        } catch (GlException e) {
            Log.e(TAG, "Failed to delete passthrough shader program", e);
        }

        deleteFramebuffer();
    }

    public void setHdrToneMappingEnabled(boolean enabled) {
        // Preserved for API compatibility with existing caller.
        hdrToneMappingEnabled = enabled;
    }

    public void setSharpness(float value) {
        sharpness = Math.max(0f, Math.min(2f, value));
    }

    public void resetSharpness() {
        sharpness = 0.2f;
    }

    public void setFsrEnabled(boolean enabled) {
        fsrEnabled = enabled;
    }

    public void setBypassScaleThreshold(float threshold) {
        // No-op in two-pass FSR implementation. Kept for API compatibility.
    }

    public void setMaxFsrPixels(int maxPixels) {
        // No-op in two-pass FSR implementation. Kept for API compatibility.
    }

    public void setOutputSizeOverride(int width, int height) {
        // No-op in two-pass FSR implementation. Kept for API compatibility.
    }

    private boolean createPrograms(String shaderDir) {
        try {
            easuProgram = new GlProgram(
                    context,
                    shaderDir + "fsr_easu_vertex.glsl",
                    shaderDir + "fsr_easu_fragment.glsl"
            );
            easuProgram.setBufferAttribute(
                    "aPosition",
                    GlUtil.getNormalizedCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            easuProgram.setBufferAttribute(
                    "aTexCoords",
                    GlUtil.getTextureCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );

            rcasProgram = new GlProgram(
                    context,
                    shaderDir + "fsr_rcas_vertex.glsl",
                    shaderDir + "fsr_rcas_fragment.glsl"
            );
            rcasProgram.setBufferAttribute(
                    "aPosition",
                    GlUtil.getNormalizedCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            rcasProgram.setBufferAttribute(
                    "aTexCoords",
                    GlUtil.getTextureCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            return true;
        } catch (GlException | IOException e) {
            Log.e(TAG, "Failed to initialize FSR programs from " + shaderDir, e);
            safeDeleteProgram(easuProgram);
            easuProgram = null;
            safeDeleteProgram(rcasProgram);
            rcasProgram = null;
            return false;
        }
    }

    private void createFramebuffer() {
        if (outputWidth <= 0 || outputHeight <= 0) {
            return;
        }
        GLES20.glGenFramebuffers(1, framebuffers, 0);
        GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, framebuffers[0]);

        GLES20.glGenTextures(1, textures, 0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textures[0]);
        GLES20.glTexImage2D(
                GLES20.GL_TEXTURE_2D,
                0,
                GLES20.GL_RGBA,
                outputWidth,
                outputHeight,
                0,
                GLES20.GL_RGBA,
                GLES20.GL_UNSIGNED_BYTE,
                null
        );
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);

        GLES20.glFramebufferTexture2D(
                GLES20.GL_FRAMEBUFFER,
                GLES20.GL_COLOR_ATTACHMENT0,
                GLES20.GL_TEXTURE_2D,
                textures[0],
                0
        );

        int status = GLES20.glCheckFramebufferStatus(GLES20.GL_FRAMEBUFFER);
        if (status != GLES20.GL_FRAMEBUFFER_COMPLETE) {
            Log.e(TAG, "Framebuffer is not complete: " + status);
            deleteFramebuffer();
        }

        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, 0);
        GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0);
    }

    private void deleteFramebuffer() {
        if (framebuffers[0] != 0) {
            GLES20.glDeleteFramebuffers(1, framebuffers, 0);
            framebuffers[0] = 0;
        }
        if (textures[0] != 0) {
            GLES20.glDeleteTextures(1, textures, 0);
            textures[0] = 0;
        }
    }

    private void drawPassthrough(int frameTexture, float[] transformMatrix) {
        GlProgram program;
        try {
            program = ensurePassthroughProgram();
            program.setSamplerTexIdUniform("inputTexture", frameTexture, 0);
            program.setFloatsUniform("uTexTransform", transformMatrix);
            // Retain old API behavior for callers that toggle HDR tone-map.
            program.setFloatUniform("uHdrToneMap", hdrToneMappingEnabled ? 1f : 0f);
            program.bindAttributesAndUniforms();
        } catch (GlException | IOException e) {
            Log.e(TAG, "Failed to bind passthrough shader program", e);
            return;
        }
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("FSR passthrough draw failed");
    }

    @Nullable
    private GlProgram passthroughProgram;

    private GlProgram ensurePassthroughProgram() throws GlException, IOException {
        if (passthroughProgram == null) {
            passthroughProgram = new GlProgram(
                    context,
                    "fsr/2.0/opt_fsr_vertex.glsl",
                    "fsr/2.0/passthrough_fragment.glsl"
            );
            passthroughProgram.setBufferAttribute(
                    "aPosition",
                    GlUtil.getNormalizedCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            passthroughProgram.setBufferAttribute(
                    "aTexCoords",
                    GlUtil.getTextureCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
        }
        return passthroughProgram;
    }

    private void checkGlError(String message) {
        try {
            GlUtil.checkGlError();
        } catch (GlException e) {
            Log.e(TAG, message, e);
        }
    }

    private void safeDeleteProgram(@Nullable GlProgram program) {
        if (program == null) {
            return;
        }
        try {
            program.delete();
        } catch (GlException e) {
            Log.w(TAG, "Failed to delete GL program", e);
        }
    }
}
