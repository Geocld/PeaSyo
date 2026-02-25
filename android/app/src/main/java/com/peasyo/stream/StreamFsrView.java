package com.peasyo.stream;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.hardware.SensorManager;
import android.util.Log;
import android.view.Gravity;
import android.widget.FrameLayout;

import androidx.media3.common.util.UnstableApi;

import com.facebook.react.bridge.ReadableMap;
import com.peasyo.lib.ConnectInfo;
import com.peasyo.lib.ConnectVideoProfile;
import com.peasyo.lib.ControllerState;
import com.peasyo.stream.fsr.FsrVideoProcessor;
import com.peasyo.stream.fsr.VideoProcessingGLSurfaceView;

@UnstableApi public class StreamFsrView extends StreamTextureView {

    private static final String TAG = "StreamFsrView";

    private VideoProcessingGLSurfaceView fsrSurfaceView;
    private FsrVideoProcessor fsrVideoProcessor;
    private boolean pendingStart;

    public StreamFsrView(Context context) {
        super(context);
    }

    @Override
    protected void initView(Context context) {
        Log.d(TAG, "Init and add fsr surfaceView");
        fsrVideoProcessor = new FsrVideoProcessor(context);
        fsrSurfaceView = new VideoProcessingGLSurfaceView(
                context,
                false,
                fsrVideoProcessor,
                new VideoProcessingGLSurfaceView.SurfaceListener() {
                    @Override
                    public void onInputSurfaceAvailable(SurfaceTexture surface) {
                        Log.d(TAG, "Input SurfaceTexture ready");
                        surfaceTexture = surface;
                        if (session != null) {
                            session.handleSessionSetSurface(surface);
                        } else if (pendingStart) {
                            pendingStart = false;
                            initSession(getContext());
                        }
                    }

                    @Override
                    public void onInputSurfaceDestroyed() {
                        Log.d(TAG, "Input SurfaceTexture destroyed");
                        surfaceTexture = null;
                        if (session != null) {
                            session.handleSessionClearSurface();
                        }
                    }
                }
        );
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT
        );
        params.gravity = Gravity.CENTER;
        fsrSurfaceView.setLayoutParams(params);
        fsrSurfaceView.setFocusable(true);
        fsrSurfaceView.setFocusableInTouchMode(true);
        addView(fsrSurfaceView);

        fsrSurfaceView.requestFocus();
        setFocusable(true);
        setFocusableInTouchMode(true);

        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        controllerState = ControllerState.init();
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (fsrSurfaceView != null) {
            fsrSurfaceView.onResume();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (fsrSurfaceView != null) {
            fsrSurfaceView.onPause();
        }
    }

    @Override
    public void startSession() {
        if (surfaceTexture == null) {
            pendingStart = true;
            return;
        }
        pendingStart = false;
        super.startSession();
    }

    @Override
    public void setConnectInfo(ConnectInfo connectInfo, ReadableMap streamInfo) {
        super.setConnectInfo(connectInfo, streamInfo);
        if (fsrSurfaceView != null && connectInfo != null) {
            ConnectVideoProfile profile = connectInfo.getVideoProfile();
            if (profile != null) {
                fsrSurfaceView.setFrameInputSize(profile.getWidth(), profile.getHeight());
            }
        }
    }
}
