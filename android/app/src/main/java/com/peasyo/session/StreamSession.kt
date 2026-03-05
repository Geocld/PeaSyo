package com.peasyo.session

import android.util.Log
import android.graphics.SurfaceTexture
import android.os.Handler
import android.os.Looper
import android.view.*
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.peasyo.MainActivity
import com.peasyo.UsbRumbleManager
import com.peasyo.audio.AudioRouteResolver
import com.peasyo.lib.ConnectInfo
import com.peasyo.lib.ConnectedEvent
import com.peasyo.lib.HolepunchFinishedEvent
import com.peasyo.lib.ControllerState
import com.peasyo.lib.CreateError
import com.peasyo.lib.Event
import com.peasyo.lib.LoginPinRequestEvent
import com.peasyo.lib.PerformanceEvent
import com.peasyo.lib.QuitEvent
import com.peasyo.lib.QuitReason
import com.peasyo.lib.HapticAudioEvent
import com.peasyo.lib.RumbleEvent
import com.peasyo.lib.Session
import com.peasyo.lib.TriggerRumbleEvent
import com.peasyo.log.LogManager

sealed class StreamState
object StreamStateIdle: StreamState()
object StreamStateConnecting: StreamState()
object StreamStateConnected: StreamState()
data class StreamStateCreateError(val error: CreateError): StreamState()
data class StreamStateQuit(val reason: QuitReason, val reasonString: String?): StreamState()
data class StreamStateLoginPinRequest(val pinIncorrect: Boolean): StreamState()

class StreamSession(
	val connectInfo: ConnectInfo,
	val logManager: LogManager,
	val logVerbose: Boolean,
	private val reactContext: ReactContext?,
	val rumble: Boolean,
	val rumbleIntensity: Int,
	val usbMode: Boolean,
	val usbController: String,
	val audioMode: String,
	val audioSharingMode: String,
	val haptic_stable_threshold: Int,
	val haptic_change_threshold: Int,
	val haptic_diff_threshold: Int,
	val hapticFeedbackIntensity: Double,
	val framePacing: Int,
)
{
	var session: Session? = null
		private set

	private val _state = MutableLiveData<StreamState>(StreamStateIdle)
	val state: LiveData<StreamState> get() = _state

	private var surfaceTexture: SurfaceTexture? = null
	private var surface: Surface? = null

	private val DSCONTROLLER_NAME = "DualSenseController"

	private val maxOperatingRate = connectInfo.videoProfile.maxOperatingRate // 从 connectInfo 获取

	private var lastProcessedEvent = RumbleEvent(0, 0)

	private var currentState = ControllerState()

	fun setControllerState(controllerState: ControllerState) {
//		Log.d("StreamView", "session setControllerState: $controllerState")
		session?.setControllerState(controllerState)
		currentState = controllerState.copy()
	}

	fun shutdown()
	{
		session?.stop()
		session?.dispose()
		session = null
		_state.value = StreamStateIdle
		//surfaceTexture?.release()

		// 断流时关闭触觉模式，避免控制器停在异常状态
		if (usbMode && usbController == DSCONTROLLER_NAME) {
			getMainActivity()?.stopHaptics()
		}

		// Stop rumble
		if (rumble) {
			if (usbMode) {
				getMainActivity()?.handleRumble(0, 0)
			} else {
				var gamepadManager = Gamepad(reactContext)
				gamepadManager.vibrate(60, 0, 0, 0, 0, rumbleIntensity)
			}
		}
	}

	fun sleep() {
		session?.gotoBed()
	}

	fun sendText(text: String) {
		session?.setText(text);
	}

	fun keyboardAccept() {
		session?.sessionKeyboardAccept()
	}

	fun keyboardReject() {
		session?.sessionKeyboardReject()
	}

	fun pause()
	{
		shutdown()
	}

	fun resume()
	{
		if(session != null)
			return
		try
		{
			val session = Session(connectInfo, logManager.createNewFile().file.absolutePath, logVerbose)
			_state.value = StreamStateConnecting
			session.eventCallback = this::eventCallback
			val sharingMode = if (audioSharingMode.equals("EXCLUSIVE", ignoreCase = true)) 1 else 0
			session.setAudioSharingMode(sharingMode)
			val appContext = reactContext?.applicationContext
			if (appContext != null) {
				val outputDeviceId = AudioRouteResolver.resolveOutputDeviceId(
					appContext,
					audioMode,
					usbMode,
					usbController
				)
				session.setAudioOutputDevice(outputDeviceId)
			}
			session.start()
			val surface = surface
			if(surface != null) {
				session.setSurface(surface, maxOperatingRate, framePacing)
			}
			this.session = session
		}
		catch(e: CreateError)
		{
			_state.value = StreamStateCreateError(e)
		}
	}

	// 设置手柄输入最小间隔（刷新率）
	// 保持智能自适应机制，仅配置最小刷新间隔
	fun setFeedbackMinInterval(minIntervalMs: Int)
	{
		session?.setFeedbackMinInterval(minIntervalMs)
	}

	private fun sendEvent(eventName: String, params: WritableMap?) {
		reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(eventName, params)
	}

	private fun createEventParams(state: StreamState): WritableMap {
		val params = Arguments.createMap()
		when (state) {
			is StreamStateIdle -> {
				params.putString("type", "idle")
			}
			is StreamStateConnecting -> {
				params.putString("type", "connecting")
			}
			is StreamStateConnected -> {
				params.putString("type", "connected")
			}
			is StreamStateCreateError -> {
				params.putString("type", "error")
				params.putString("error", state.error.toString())
			}
			is StreamStateQuit -> {
				params.putString("type", "quit")
				params.putString("reason", state.reason.toString())
				params.putString("reasonString", state.reasonString)
			}
			is StreamStateLoginPinRequest -> {
				params.putString("type", "pinRequest")
				params.putBoolean("pinIncorrect", state.pinIncorrect)
			}
		}
		return params
	}

	private fun getMainActivity(): MainActivity? {
		return reactContext?.currentActivity as? MainActivity
	}

	// 判断触发器参数是否全 0（用于右侧缺省数据回退）
	private fun isZeroTriggerData(data: ByteArray): Boolean {
		for (b in data) {
			if ((b.toInt() and 0xFF) != 0) {
				return false
			}
		}
		return true
	}

	// ByteArray 转 JS 可读数组，按无符号字节上报
	private fun triggerDataToWritableArray(data: ByteArray) = Arguments.createArray().apply {
		data.forEach { pushInt(it.toInt() and 0xFF) }
	}

	private fun eventCallback(event: Event)
	{
		when(event)
		{
			is ConnectedEvent -> {
				_state.postValue(StreamStateConnected)

				val params = Arguments.createMap().apply {
					putString("type", "connected")
				}
				sendEvent("streamStateChange", params)

				// 连接成功后尝试打开 DualSense 触觉模式
				if (usbMode && usbController == DSCONTROLLER_NAME) {
					getMainActivity()?.startHaptics()
				}
			}
			is HolepunchFinishedEvent -> {
				val params = Arguments.createMap().apply {
					putString("type", "holepunchFinished")
				}
				sendEvent("streamStateChange", params)
			}
			is QuitEvent -> {
				val state = StreamStateQuit(event.reason, event.reasonString)
				_state.postValue(state)
				val params = createEventParams(state)
				sendEvent("streamStateChange", params)
			}
			is LoginPinRequestEvent -> {
				val state = StreamStateLoginPinRequest(event.pinIncorrect)
				_state.postValue(state)
				val params = createEventParams(state)
				Log.d("StreamView", "loginPinRequest: $params")
				sendEvent("streamStateChange", params)
			}
			is RumbleEvent -> {
				if (!rumble) {
					return
				}

				// 若 DualSense 触觉已激活，跳过 rumble 降级逻辑，避免叠加振动
				if (usbMode && usbController == DSCONTROLLER_NAME) {
					val hapticsActive = getMainActivity()?.isDualSenseHapticsActive() ?: false
					if (hapticsActive) {
						return
					}
				}

				var left = event.left.coerceIn(0, 255)
				var right = event.right.coerceIn(0, 255)

				// 轻微门限，极小值直接归零，停止要果断
				if (left <= 1) left = 0
				if (right <= 1) right = 0

				if (left == lastProcessedEvent.left && right == lastProcessedEvent.right) {
					return
				}
				lastProcessedEvent = RumbleEvent(left, right)

				if (usbMode) {
					if (usbController == DSCONTROLLER_NAME) {
						val params = Arguments.createMap().apply {
							putInt("left", left)
							putInt("right", right)
						}
						sendEvent("dsRumble", params)
					} else {
						val inputMax = 255
						val outputMax = 32767
						val leftOut = (left * outputMax / inputMax).coerceAtMost(outputMax)
						val rightOut = (right * outputMax / inputMax).coerceAtMost(outputMax)
						getMainActivity()?.handleRumble(leftOut.toShort(), rightOut.toShort())
					}
				} else {
					val gamepadManager = Gamepad(reactContext)
					// 持续振动由下一帧覆盖，收到 0 时由底层 cancel 立即停止。
					gamepadManager.vibrate(60000, left, right, 0, 0, rumbleIntensity)
				}
			}
			is HapticAudioEvent -> {
				// 仅在 USB DualSense 模式下转发原始触觉音频
				if (usbMode && usbController == DSCONTROLLER_NAME) {
					getMainActivity()?.handleHapticAudio(
						event.pcmData,
						hapticFeedbackIntensity.toFloat()
					)
				}
			}
			is TriggerRumbleEvent -> { // Adaptive trigger
//				Log.d("StreamView", "TriggerRumbleEvent: $event")

				if (usbMode) {
					val left_type = event.typeLeft
					val left_data = event.left
					val right_is_empty = isZeroTriggerData(event.right)
					// 部分后端只给左侧参数；右侧为空时回退左侧，避免触发器效果丢失
					val right_type =
						if (event.typeRight == 0 && right_is_empty) event.typeLeft else event.typeRight
					val right_data =
						if (event.typeRight == 0 && right_is_empty) event.left else event.right

					val params = Arguments.createMap().apply {
						putInt("leftType", left_type)
						putArray("leftData", triggerDataToWritableArray(left_data))
						putInt("rightType", right_type)
						putArray("rightData", triggerDataToWritableArray(right_data))
					}
					sendEvent("trigger", params);
				}
			}
			is PerformanceEvent -> {
//				Log.d("StreamView", "PerformanceEvent: $event")
				val params = Arguments.createMap().apply {
					putDouble("rtt", event.rtt)
					putDouble("bitrate", event.bitrate)
					putDouble("packetLoss", event.packetLoss)
					putDouble("decodeTime", event.decodeTime)
					putDouble("fps", event.fps)
					putDouble("frameLost", event.frameLost)
					// 给前端性能条附带触觉状态：仅 DualSense 触觉真正激活时为 true
					putBoolean(
						"hapticsActive",
						if (usbMode && usbController == DSCONTROLLER_NAME) {
							getMainActivity()?.isDualSenseHapticsActive() ?: false
						} else {
							false
						}
					)
				}
				sendEvent("performance", params)
			}
		}
	}

	fun attachToSurfaceView(surfaceView: SurfaceView)
	{
		surfaceView.post {
			val currentSurface = surfaceView.holder.surface
			if (currentSurface != null && currentSurface.isValid) {
				this@StreamSession.surface = currentSurface
				session?.setSurface(currentSurface, maxOperatingRate, framePacing)
			}
		}

		surfaceView.holder.addCallback(object: SurfaceHolder.Callback {
			override fun surfaceCreated(holder: SurfaceHolder) { }

			override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int)
			{
				val surface = holder.surface
				Log.d("StreamView", "surfaceChanged:" + surface)
				this@StreamSession.surface = surface
				session?.setSurface(surface, maxOperatingRate, framePacing)
			}

			override fun surfaceDestroyed(holder: SurfaceHolder)
			{
				Log.d("StreamView", "surfaceDestroyed:" + surface)
				this@StreamSession.surface = null
				session?.setSurface(null, 0x7FFF, framePacing) // or a sensible default when surface is destroyed
			}
		})
	}

	// Only for textureview mode
	fun handleSessionSetSurface(surface: SurfaceTexture) {
		Log.d("StreamView", "handleSessionSetSurface")
		surfaceTexture = surface
		this@StreamSession.surface?.release()
		val newSurface = Surface(surfaceTexture)
		this@StreamSession.surface = newSurface
		session?.setSurface(newSurface, maxOperatingRate, framePacing)
	}

	fun handleSessionClearSurface() {
		Log.d("StreamView", "handleSessionClearSurface")
		surfaceTexture = null
		session?.setSurface(null, 0x7FFF, framePacing)
		this@StreamSession.surface?.let {
			it.release()
		}
		this@StreamSession.surface = null
	}

	fun setLoginPin(pin: String)
	{
		session?.setLoginPin(pin)
	}
}
