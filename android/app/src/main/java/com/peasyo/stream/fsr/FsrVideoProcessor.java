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

    private static final int PIPELINE_NONE = 0;
    private static final int PIPELINE_TWO_PASS = 1;
    private static final int PIPELINE_MOBILE_SINGLE_PASS = 2;

    private final Context context;

    private int pipelineMode = PIPELINE_NONE;
    private String activeShaderDir = "fsr/2.0/";
    private boolean needInputSize = true;

    private final int[] framebuffers = new int[1];
    private final int[] textures = new int[1];

    @Nullable
    private GlProgram easuProgram;
    @Nullable
    private GlProgram rcasProgram;
    @Nullable
    private GlProgram mobileProgram;
    @Nullable
    private GlProgram passthroughProgram;

    // RCAS sharpness is inverse (0 = strongest, bigger = weaker).
    private float rcasSharpness = 0.2f;
    // Mobile single-pass shader uses 1.0 as normal strength.
    private float mobileSharpness = 1.2f;

    private boolean mobileHasSharpness;
    private boolean mobileHasHdrToneMap;

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
        resetPrograms();
        deleteFramebuffer();

        boolean supportsExternalOesEssl3 = extensions != null
                && extensions.contains("GL_OES_EGL_image_external_essl3");

        String preferredDir = "fsr/2.0/";
        boolean preferredNeedInputSize = true;
        if (supportsExternalOesEssl3) {
            if (glMajorVersion > 3 || (glMajorVersion == 3 && glMinorVersion >= 1)) {
                preferredDir = "fsr/3.1/";
                preferredNeedInputSize = false;
            } else if (glMajorVersion == 3 && glMinorVersion == 0) {
                preferredDir = "fsr/3.0/";
                preferredNeedInputSize = false;
            }
        } else if (glMajorVersion >= 3) {
            Log.w(TAG, "GLES3 context without GL_OES_EGL_image_external_essl3, force FSR 2.0 shaders");
        }

        Log.i(TAG, "FSR preferred shader dir: " + preferredDir);
        Log.i(TAG, "OpenGL extensions: " + extensions);

        boolean skipTwoPassForDriverStability = extensions != null && extensions.contains("GL_QCOM_");
        if (skipTwoPassForDriverStability) {
            Log.w(TAG, "Skip two-pass FSR on current QCOM driver, use mobile pipeline for stability");
        }

        if (!skipTwoPassForDriverStability
                && (tryInitTwoPass(preferredDir, preferredNeedInputSize)
                || (!"fsr/2.0/".equals(preferredDir) && tryInitTwoPass("fsr/2.0/", true)))) {
            // Keep texture parameters aligned with TvBox FsrVideoProcessor implementation.
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_REPEAT);
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_REPEAT);
            return;
        }

        // If two-pass FSR hits driver compiler bugs, fallback to mobile single-pass FSR (still has sharpening).
        if (tryInitMobileSinglePass("fsr/2.0/", true, true, true)
                || (!"fsr/2.0/".equals(preferredDir)
                && tryInitMobileSinglePass(preferredDir, preferredNeedInputSize, false, false))) {
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_NEAREST);
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_REPEAT);
            GLES20.glTexParameterf(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_REPEAT);
            return;
        }

        pipelineMode = PIPELINE_NONE;
        activeShaderDir = "none";
        Log.e(TAG, "All FSR pipelines failed, fallback to passthrough only");
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

        if (pipelineMode == PIPELINE_TWO_PASS) {
            deleteFramebuffer();
            createFramebuffer();
        } else {
            deleteFramebuffer();
        }
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

        if (pipelineMode == PIPELINE_TWO_PASS) {
            drawTwoPass(frameTexture, frameWidth, frameHeight, transformMatrix);
            return;
        }
        if (pipelineMode == PIPELINE_MOBILE_SINGLE_PASS) {
            drawMobileSinglePass(frameTexture, frameWidth, frameHeight, transformMatrix);
            return;
        }

        drawPassthrough(frameTexture, transformMatrix);
    }

    @Override
    public void release() {
        resetPrograms();
        deleteFramebuffer();
    }

    public void setHdrToneMappingEnabled(boolean enabled) {
        hdrToneMappingEnabled = enabled;
    }

    public void setSharpness(float value) {
        float clamped = Math.max(0f, Math.min(2f, value));
        mobileSharpness = clamped;
        // Map [0..2] (stronger as larger) to RCAS stop domain [2..0].
        rcasSharpness = 2f - clamped;
    }

    public void resetSharpness() {
        rcasSharpness = 0.2f;
        mobileSharpness = 1.2f;
    }

    public void setFsrEnabled(boolean enabled) {
        fsrEnabled = enabled;
    }

    public void setBypassScaleThreshold(float threshold) {
        // No-op in current FSR pipeline. Kept for API compatibility.
    }

    public void setMaxFsrPixels(int maxPixels) {
        // No-op in current FSR pipeline. Kept for API compatibility.
    }

    public void setOutputSizeOverride(int width, int height) {
        // No-op in current FSR pipeline. Kept for API compatibility.
    }

    private boolean tryInitTwoPass(String shaderDir, boolean requireInputSize) {
        try {
            GlProgram easu = new GlProgram(
                    context,
                    shaderDir + "fsr_easu_vertex.glsl",
                    shaderDir + "fsr_easu_fragment.glsl"
            );
            easu.setBufferAttribute(
                    "aPosition",
                    GlUtil.getNormalizedCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            easu.setBufferAttribute(
                    "aTexCoords",
                    GlUtil.getTextureCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );

            GlProgram rcas = new GlProgram(
                    context,
                    shaderDir + "fsr_rcas_vertex.glsl",
                    shaderDir + "fsr_rcas_fragment.glsl"
            );
            rcas.setBufferAttribute(
                    "aPosition",
                    GlUtil.getNormalizedCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );
            rcas.setBufferAttribute(
                    "aTexCoords",
                    GlUtil.getTextureCoordinateBounds(),
                    GlUtil.HOMOGENEOUS_COORDINATE_VECTOR_SIZE
            );

            easuProgram = easu;
            rcasProgram = rcas;
            needInputSize = requireInputSize;
            pipelineMode = PIPELINE_TWO_PASS;
            activeShaderDir = shaderDir;
            if (outputWidth > 0 && outputHeight > 0) {
                createFramebuffer();
            }
            Log.i(TAG, "FSR pipeline active: two-pass, shaderDir=" + shaderDir);
            return true;
        } catch (GlException | IOException e) {
            Log.e(TAG, "Failed to initialize two-pass FSR from " + shaderDir, e);
            safeDeleteProgram(easuProgram);
            easuProgram = null;
            safeDeleteProgram(rcasProgram);
            rcasProgram = null;
            return false;
        }
    }

    private boolean tryInitMobileSinglePass(String shaderDir,
                                            boolean requireInputSize,
                                            boolean hasHdrToneMapUniform,
                                            boolean hasSharpnessUniform) {
        try {
            GlProgram program = new GlProgram(
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

            mobileProgram = program;
            needInputSize = requireInputSize;
            mobileHasHdrToneMap = hasHdrToneMapUniform;
            mobileHasSharpness = hasSharpnessUniform;
            pipelineMode = PIPELINE_MOBILE_SINGLE_PASS;
            activeShaderDir = shaderDir;
            deleteFramebuffer();
            Log.w(TAG, "FSR pipeline fallback: mobile single-pass, shaderDir=" + shaderDir);
            return true;
        } catch (GlException | IOException e) {
            Log.e(TAG, "Failed to initialize mobile single-pass FSR from " + shaderDir, e);
            safeDeleteProgram(mobileProgram);
            mobileProgram = null;
            return false;
        }
    }

    private void drawTwoPass(int frameTexture,
                             int frameWidth,
                             int frameHeight,
                             float[] transformMatrix) {
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
            inputTextureSize = (frameWidth > 0 && frameHeight > 0)
                    ? new float[]{frameWidth, frameHeight}
                    : new float[]{0f, 0f};
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
            Log.e(TAG, "Failed to bind EASU shader program (" + activeShaderDir + ")", e);
            GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0);
            fallbackToMobileSinglePass("bind-easu");
            if (pipelineMode == PIPELINE_MOBILE_SINGLE_PASS) {
                drawMobileSinglePass(frameTexture, frameWidth, frameHeight, transformMatrix);
            } else {
                drawPassthrough(frameTexture, transformMatrix);
            }
            return;
        }
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("Failed EASU draw");

        GLES20.glBindFramebuffer(GLES20.GL_FRAMEBUFFER, 0);
        try {
            rcas.setSamplerTexIdUniform("inputTexture", textures[0], 0);
            if (needInputSize) {
                rcas.setFloatsUniform("inputTextureSize", outputSize);
            }
            rcas.setFloatUniform("sharpness", rcasSharpness);
            rcas.bindAttributesAndUniforms();
        } catch (GlException e) {
            Log.e(TAG, "Failed to bind RCAS shader program (" + activeShaderDir + ")", e);
            fallbackToMobileSinglePass("bind-rcas");
            if (pipelineMode == PIPELINE_MOBILE_SINGLE_PASS) {
                drawMobileSinglePass(frameTexture, frameWidth, frameHeight, transformMatrix);
            } else {
                drawPassthrough(frameTexture, transformMatrix);
            }
            return;
        }
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("Failed RCAS draw");
    }

    private void drawMobileSinglePass(int frameTexture,
                                      int frameWidth,
                                      int frameHeight,
                                      float[] transformMatrix) {
        GlProgram program = mobileProgram;
        if (program == null || outputWidth <= 0 || outputHeight <= 0) {
            drawPassthrough(frameTexture, transformMatrix);
            return;
        }

        float[] inputTextureSize = null;
        if (needInputSize) {
            inputTextureSize = (frameWidth > 0 && frameHeight > 0)
                    ? new float[]{frameWidth, frameHeight}
                    : new float[]{0f, 0f};
        }

        try {
            program.setSamplerTexIdUniform("inputTexture", frameTexture, 0);
            if (inputTextureSize != null) {
                program.setFloatsUniform("inputTextureSize", inputTextureSize);
            }
            program.setFloatsUniform("outputTextureSize", outputSize);
            program.setFloatsUniform("uTexTransform", transformMatrix);
            if (mobileHasHdrToneMap) {
                program.setFloatUniform("uHdrToneMap", hdrToneMappingEnabled ? 1f : 0f);
            }
            if (mobileHasSharpness) {
                program.setFloatUniform("sharpness", mobileSharpness);
            }
            program.bindAttributesAndUniforms();
        } catch (GlException e) {
            Log.e(TAG, "Failed to bind mobile FSR shader program (" + activeShaderDir + ")", e);
            drawPassthrough(frameTexture, transformMatrix);
            return;
        }

        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        checkGlError("Failed mobile FSR draw");
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

    private void resetPrograms() {
        safeDeleteProgram(easuProgram);
        easuProgram = null;

        safeDeleteProgram(rcasProgram);
        rcasProgram = null;

        safeDeleteProgram(mobileProgram);
        mobileProgram = null;

        safeDeleteProgram(passthroughProgram);
        passthroughProgram = null;

        pipelineMode = PIPELINE_NONE;
        activeShaderDir = "none";
        needInputSize = true;
        mobileHasSharpness = false;
        mobileHasHdrToneMap = false;
    }

    private void fallbackToMobileSinglePass(String reason) {
        if (pipelineMode != PIPELINE_TWO_PASS) {
            return;
        }
        String failedShaderDir = activeShaderDir;
        boolean failedNeedInputSize = needInputSize;
        Log.w(TAG, "Switching pipeline from two-pass to mobile single-pass, reason=" + reason
                + ", shaderDir=" + activeShaderDir);
        safeDeleteProgram(easuProgram);
        easuProgram = null;
        safeDeleteProgram(rcasProgram);
        rcasProgram = null;
        deleteFramebuffer();
        pipelineMode = PIPELINE_NONE;
        activeShaderDir = "none";

        if (tryInitMobileSinglePass("fsr/2.0/", true, true, true)) {
            return;
        }
        if (!"fsr/2.0/".equals(failedShaderDir)) {
            tryInitMobileSinglePass(failedShaderDir, failedNeedInputSize, false, false);
        }
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
