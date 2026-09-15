package com.peasyo.session

import android.app.Presentation
import android.content.Context
import android.graphics.Color
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import android.view.Display
import android.view.Gravity
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.view.ViewGroup
import android.view.Window
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * 外接显示器输出控制器
 *
 * 通过 Presentation 把串流画面呈现到非默认 Display（USB-C DP Alt Mode / HDMI 底座），
 * 解码器渲染目标在手机 Surface 与外屏 Surface 之间动态切换（AMediaCodec_setOutputSurface）。
 * 音频路由切换由 StreamSession.switchToExternal / switchToPhone 完成。
 */
class ExternalDisplayController private constructor(private val reactContext: ReactContext) {

	companion object {
		const val TAG = "ExternalDisplay"
		const val EVENT_STATE_CHANGE = "onExternalDisplayStateChange"

		// 外屏刷新率偏好
		const val REFRESH_RATE_AUTO = 0   // 跟随串流帧率
		const val REFRESH_RATE_60 = 60    // 强制 60Hz
		const val REFRESH_RATE_120 = 120  // 强制 120Hz

		@Volatile
		private var instance: ExternalDisplayController? = null

		@JvmStatic
		var refreshRatePreference: Int = REFRESH_RATE_AUTO

		@JvmStatic
		fun getInstance(reactContext: ReactContext): ExternalDisplayController {
			return instance ?: synchronized(this) {
				instance ?: ExternalDisplayController(reactContext).also { instance = it }
			}
		}
	}

	private val mainHandler = Handler(Looper.getMainLooper())
	private val displayManager by lazy {
		reactContext.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
	}

	private var presentation: ExternalDisplayPresentation? = null
	private var listenerRegistered = false
	private var wakeLock: PowerManager.WakeLock? = null

	private val displayListener = object : DisplayManager.DisplayListener {
		override fun onDisplayAdded(displayId: Int) {
			notifyState("displayAdded")
		}

		override fun onDisplayRemoved(displayId: Int) {
			mainHandler.post {
				val p = presentation
				if (p != null && p.display.displayId == displayId) {
					Log.i(TAG, "External display removed, switching back to phone")
					teardownPresentation()
					StreamSession.activeSession?.switchToPhone()
					notifyState("displayRemoved")
				}
			}
		}

		override fun onDisplayChanged(displayId: Int) {}
	}

	/** 是否存在可用的外接显示器 */
	fun isExternalDisplayAvailable(): Boolean = pickExternalDisplay() != null

	/** 外屏输出当前是否激活 */
	fun isOutputActive(): Boolean = presentation != null

	/** 开启外屏输出（需已存在活跃会话） */
	fun enable(callback: (success: Boolean, error: String?) -> Unit) {
		mainHandler.post {
			val session = StreamSession.activeSession
			if (session == null) {
				callback(false, "no_active_session")
				return@post
			}
			if (presentation != null) {
				callback(true, null)
				return@post
			}
			val display = pickExternalDisplay()
			if (display == null) {
				Log.w(TAG, "enable: no external display")
				callback(false, "no_external_display")
				return@post
			}
			registerListener()
			// 先启动前台服务：保持进程存活（挂起/切后台时外屏继续输出）
			ExternalDisplayService.start(reactContext)
			// Presentation 挂在 app context 上：不随 Activity 停止/销毁而关闭
			val ownerContext = reactContext.applicationContext
			// 按偏好匹配外屏刷新率模式（不支持时回退系统默认）
			val preferredModeId = pickPreferredModeId(display)
			try {
				val p = ExternalDisplayPresentation(ownerContext, display, preferredModeId)
				p.setOnDismissListener {
					// 系统或用户关闭 Presentation：切回手机
					if (presentation === p) {
						teardownPresentation()
						StreamSession.activeSession?.switchToPhone()
						notifyState("presentationDismissed")
					}
				}
				p.show()
				presentation = p
				acquireWakeLock()
				Log.i(TAG, "External output enabled on display ${display.displayId}")
				notifyState("enabled")
				callback(true, null)
			} catch (e: Exception) {
				Log.e(TAG, "enable failed", e)
				presentation = null
				releaseWakeLock()
				ExternalDisplayService.stop(reactContext)
				callback(false, e.message ?: "show_failed")
			}
		}
	}

	/** 关闭外屏输出，切回手机画面与音频 */
	fun disable(callback: (success: Boolean) -> Unit) {
		mainHandler.post {
			teardownPresentation()
			StreamSession.activeSession?.switchToPhone()
			Log.i(TAG, "External output disabled")
			notifyState("disabled")
			callback(true)
		}
	}

	private fun teardownPresentation() {
		val p = presentation ?: return
		presentation = null
		p.setOnDismissListener(null)
		try {
			if (p.isShowing) {
				p.dismiss()
			}
		} catch (e: Exception) {
			Log.w(TAG, "dismiss presentation failed", e)
		}
		releaseWakeLock()
		// 外屏输出结束：停止前台服务与常驻通知
		ExternalDisplayService.stop(reactContext)
	}

	/** 选择分辨率最大的非默认 Display */
	private fun pickExternalDisplay(): Display? {
		var best: Display? = null
		var bestArea = 0L
		for (d in displayManager.getDisplays()) {
			if (d.displayId == Display.DEFAULT_DISPLAY) continue
			if (d.state == Display.STATE_OFF) continue
			val mode = d.mode
			val area = mode.physicalWidth.toLong() * mode.physicalHeight
			if (best == null || area > bestArea) {
				best = d
				bestArea = area
			}
		}
		return best
	}

	/**
	 * 按刷新率偏好匹配外屏显示模式：
	 * AUTO -> 跟随串流帧率；60/120 -> 强制指定（取不超过该刷新率的最高分辨率模式）。
	 * 匹配不到返回 0（系统默认模式）。
	 */
	private fun pickPreferredModeId(display: Display): Int {
		try {
			val targetHz = when (refreshRatePreference) {
				REFRESH_RATE_60 -> 60f
				REFRESH_RATE_120 -> 120f
				else -> {
					// AUTO：跟随串流帧率
					val streamFps = StreamSession.activeSession?.connectInfo?.videoProfile?.maxFPS ?: 60
					streamFps.toFloat()
				}
			}
			val modes = display.supportedModes
			if (modes.isNullOrEmpty()) {
				return 0
			}
			// 候选：刷新率在目标 ±1.5Hz 容差内（兼容 59.94Hz 等），取分辨率最高的模式
			var best: Display.Mode? = null
			var bestArea = 0L
			for (m in modes) {
				if (Math.abs(m.refreshRate - targetHz) > 1.5f) continue
				val area = m.physicalWidth.toLong() * m.physicalHeight
				if (best == null || area > bestArea) {
					best = m
					bestArea = area
				}
			}
			if (best == null) {
				Log.w(TAG, "No display mode near ${targetHz}Hz (supported: ${modes.map { it.refreshRate }})")
				return 0
			}
			Log.i(TAG, "Pick display mode ${best.modeId}: ${best.physicalWidth}x${best.physicalHeight}@${best.refreshRate}Hz (target ${targetHz}Hz)")
			return best.modeId
		} catch (e: Exception) {
			Log.w(TAG, "pickPreferredModeId failed: ${e.message}")
			return 0
		}
	}

	private fun registerListener() {
		if (listenerRegistered) return
		displayManager.registerDisplayListener(displayListener, mainHandler)
		listenerRegistered = true
	}

	private fun acquireWakeLock() {
		if (wakeLock?.isHeld == true) return
		val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
		wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "peasyo:ExternalDisplayOutput").apply {
			setReferenceCounted(false)
			acquire()
		}
	}

	private fun releaseWakeLock() {
		wakeLock?.let {
			if (it.isHeld) {
				it.release()
			}
		}
		wakeLock = null
	}

	private fun notifyState(reason: String) {
		try {
			val params: WritableMap = Arguments.createMap().apply {
				putBoolean("active", presentation != null)
				putString("reason", reason)
			}
			reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
				.emit(EVENT_STATE_CHANGE, params)
		} catch (e: Exception) {
			Log.w(TAG, "notifyState failed: ${e.message}")
		}
	}
}

/**
 * 外屏呈现窗口：黑底全屏 SurfaceView，Surface 就绪后把解码器渲染目标切到外屏。
 * preferredModeId > 0 时请求指定的显示模式（刷新率匹配）。
 */
class ExternalDisplayPresentation(
	context: Context,
	display: Display,
	private val preferredModeId: Int = 0,
) : Presentation(context, display) {

	companion object {
		private const val TAG = "ExternalDisplay"
	}

	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		requestWindowFeature(Window.FEATURE_NO_TITLE)

		// 应用刷新率匹配的显示模式
		if (preferredModeId > 0) {
			try {
				window?.attributes = window?.attributes?.apply {
					preferredDisplayModeId = preferredModeId
				}
				Log.i(TAG, "Requested preferred display mode $preferredModeId")
			} catch (e: Exception) {
				Log.w(TAG, "set preferredDisplayModeId failed: ${e.message}")
			}
		}

		val frame = FrameLayout(context)
		frame.setBackgroundColor(Color.BLACK)
		val surfaceView = SurfaceView(context)
		surfaceView.layoutParams = FrameLayout.LayoutParams(
			ViewGroup.LayoutParams.MATCH_PARENT,
			ViewGroup.LayoutParams.MATCH_PARENT,
			Gravity.CENTER
		)
		frame.addView(surfaceView)
		setContentView(frame)

		surfaceView.holder.addCallback(object : SurfaceHolder.Callback {
			override fun surfaceCreated(holder: SurfaceHolder) {}

			override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
				val surface: Surface = holder.surface
				if (surface.isValid) {
					Log.d(TAG, "External presentation surface ready, switching decoder")
					StreamSession.activeSession?.switchToExternal(surface)
				}
			}

			override fun surfaceDestroyed(holder: SurfaceHolder) {
				// 销毁路径统一由 OnDismissListener / DisplayListener 处理
			}
		})
	}
}
