package com.peasyo.stream.fsr;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.SurfaceTexture;
import android.opengl.EGL14;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.media3.common.util.GlUtil;
import androidx.media3.common.util.GlUtil.GlException;
import androidx.media3.common.util.UnstableApi;

import java.util.concurrent.atomic.AtomicBoolean;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;
import javax.microedition.khronos.opengles.GL10;

/**
 * GLSurfaceView 包装类，接收上游 SurfaceTexture 帧并交给 VideoProcessor 做二次处理。
 */
@SuppressLint("ViewConstructor")
@UnstableApi
public class VideoProcessingGLSurfaceView extends GLSurfaceView {

    public static final int EGL_PROTECTED_CONTENT_EXT = 0x32C0;
    private static final String TAG = "VideoProcessingGLView";

    private final VideoProcessor videoProcessor;
    private final SurfaceListener surfaceListener;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final VideoRenderer renderer = new VideoRenderer();

    public VideoProcessingGLSurfaceView(
            Context context,
            boolean requireSecureContext,
            VideoProcessor videoProcessor,
            SurfaceListener surfaceListener
    ) {
        super(context);
        this.videoProcessor = videoProcessor;
        this.surfaceListener = surfaceListener;
        init(requireSecureContext);
    }

    private void init(boolean requireSecureContext) {
        setEGLContextClientVersion(2);
        setEGLConfigChooser(8, 8, 8, 8, 0, 0);
        setEGLContextFactory(new ContextFactory(requireSecureContext));
        setEGLWindowSurfaceFactory(new WindowSurfaceFactory(requireSecureContext));
        setRenderer(renderer);
        setRenderMode(RENDERMODE_WHEN_DIRTY);
    }

    /**
     * 提供给上层设置当前视频帧原始输入尺寸，供 FSR 计算使用。
     */
    public void setFrameInputSize(int width, int height) {
        renderer.setFrameSize(width, height);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        queueEvent(() -> {
            renderer.release();
            videoProcessor.release();
        });
        mainHandler.post(surfaceListener::onInputSurfaceDestroyed);
    }

    private final class VideoRenderer implements Renderer {

        private final AtomicBoolean frameAvailable = new AtomicBoolean(false);
        private final float[] transformMatrix = new float[16];

        private SurfaceTexture inputSurfaceTexture;
        private int textureId;
        private boolean initialized = false;
        private long frameTimestampUs;
        private int frameWidth;
        private int frameHeight;

        void setFrameSize(int width, int height) {
            frameWidth = width;
            frameHeight = height;
        }

        @Override
        public void onSurfaceCreated(GL10 gl, EGLConfig config) {
            try {
                textureId = GlUtil.createExternalTexture();
            } catch (GlException e) {
                Log.e(TAG, "Failed to create external texture", e);
            }
            Log.d(TAG, "GL surface created, textureId=" + textureId);
            inputSurfaceTexture = new SurfaceTexture(textureId);
            inputSurfaceTexture.setOnFrameAvailableListener(surfaceTexture -> {
                frameAvailable.set(true);
                requestRender();
            });
            notifySurfaceAvailable(inputSurfaceTexture);
        }

        @Override
        public void onSurfaceChanged(GL10 gl, int width, int height) {
            GLES20.glViewport(0, 0, width, height);
            videoProcessor.setSurfaceSize(width, height);
        }

        @Override
        public void onDrawFrame(GL10 gl) {
            if (!initialized) {
                initializeProcessor(gl);
            }

            if (frameAvailable.compareAndSet(true, false)) {
                SurfaceTexture surfaceTexture = inputSurfaceTexture;
                if (surfaceTexture != null) {
                    surfaceTexture.updateTexImage();
                    frameTimestampUs = surfaceTexture.getTimestamp() / 1000;
                    surfaceTexture.getTransformMatrix(transformMatrix);
                }
            }

            try {
                videoProcessor.draw(
                        textureId,
                        frameTimestampUs,
                        frameWidth,
                        frameHeight,
                        transformMatrix
                );
            } catch (GlException e) {
                throw new RuntimeException(e);
            }
        }

        private void initializeProcessor(GL10 gl) {
            String version = gl.glGetString(GL10.GL_VERSION);
            if (version == null) {
                version = "";
            }
            String cleaned = version.replace("OpenGL ES ", "");
            String[] parts = cleaned.split("[ .]");
            int major = parts.length > 0 ? parseInt(parts[0], 2) : 2;
            int minor = parts.length > 1 ? parseInt(parts[1], 0) : 0;
            String extensions = gl.glGetString(GL10.GL_EXTENSIONS);
            videoProcessor.initialize(major, minor, extensions != null ? extensions : "");
            initialized = true;
            Log.d(TAG, "VideoProcessor initialized, glVersion=" + major + "." + minor);
        }

        private int parseInt(String text, int fallback) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException e) {
                return fallback;
            }
        }

        void release() {
            if (inputSurfaceTexture != null) {
                inputSurfaceTexture.release();
                inputSurfaceTexture = null;
            }
            if (textureId != 0) {
                GLES20.glDeleteTextures(1, new int[]{textureId}, 0);
                textureId = 0;
            }
        }

        private void notifySurfaceAvailable(SurfaceTexture surfaceTexture) {
            Log.d(TAG, "Input SurfaceTexture available");
            mainHandler.post(() -> surfaceListener.onInputSurfaceAvailable(surfaceTexture));
        }
    }

    private static final class ContextFactory implements EGLContextFactory {

        private final boolean requireSecure;

        ContextFactory(boolean requireSecure) {
            this.requireSecure = requireSecure;
        }

        @Override
        public EGLContext createContext(EGL10 egl, EGLDisplay display, EGLConfig eglConfig) {
            int[] attrs = new int[]{
                    EGL14.EGL_CONTEXT_CLIENT_VERSION, 3,
                    EGL14.EGL_NONE
            };
            if (requireSecure) {
                attrs = new int[]{
                        EGL14.EGL_CONTEXT_CLIENT_VERSION, 3,
                        EGL_PROTECTED_CONTENT_EXT, EGL14.EGL_TRUE,
                        EGL14.EGL_NONE
                };
            }
            EGLContext context = egl.eglCreateContext(display, eglConfig, EGL10.EGL_NO_CONTEXT, attrs);
            if (context == null || EGL14.eglGetError() != EGL14.EGL_SUCCESS) {
                if (context != null) {
                    egl.eglDestroyContext(display, context);
                }
                int[] fallbackAttrs = new int[]{
                        EGL14.EGL_CONTEXT_CLIENT_VERSION, 2,
                        EGL14.EGL_NONE
                };
                context = egl.eglCreateContext(display, eglConfig, EGL10.EGL_NO_CONTEXT, fallbackAttrs);
            }
            return context;
        }

        @Override
        public void destroyContext(EGL10 egl, EGLDisplay display, EGLContext context) {
            egl.eglDestroyContext(display, context);
        }
    }

    private static final class WindowSurfaceFactory implements EGLWindowSurfaceFactory {

        private final boolean requireSecure;

        WindowSurfaceFactory(boolean requireSecure) {
            this.requireSecure = requireSecure;
        }

        @Override
        public EGLSurface createWindowSurface(EGL10 egl, EGLDisplay display, EGLConfig config, Object nativeWindow) {
            int[] attribList = requireSecure
                    ? new int[]{EGL_PROTECTED_CONTENT_EXT, EGL14.EGL_TRUE, EGL10.EGL_NONE}
                    : new int[]{EGL10.EGL_NONE};
            return egl.eglCreateWindowSurface(display, config, nativeWindow, attribList);
        }

        @Override
        public void destroySurface(EGL10 egl, EGLDisplay display, EGLSurface surface) {
            egl.eglDestroySurface(display, surface);
        }
    }

    public interface VideoProcessor {
        void initialize(int glMajorVersion, int glMinorVersion, String extensions);

        void setSurfaceSize(int width, int height);

        void draw(int frameTexture,
                  long frameTimestampUs,
                  int frameWidth,
                  int frameHeight,
                  float[] transformMatrix) throws GlException;

        void release();
    }

    public interface SurfaceListener {
        void onInputSurfaceAvailable(@NonNull SurfaceTexture surfaceTexture);

        void onInputSurfaceDestroyed();
    }
}
