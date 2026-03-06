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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.delay

import kotlinx.coroutines.sync.withLock

import java.lang.Math.abs

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

	private val vibrateMutex = Mutex()
	private val vibrateScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

	private val RUMBLE_MIN_LEVEL = 10
	private val BT_RUMBLE_DURATION_MS = 15

	private val DSCONTROLLER_NAME = "DualSenseController"

	private val maxOperatingRate = connectInfo.videoProfile.maxOperatingRate // 从 connectInfo 获取

	private data class AudioHapticsState(
		var lastLeft: Int = 0,
		var lastRight: Int = 0,
		var isVibrating: Boolean = false,
		var lastActionTime: Long = System.currentTimeMillis()
	)

	private var lastProcessedEvent = RumbleEvent(0, 0)
	// 直下发输出报告时，需要与触发器参数更新保持一致性
	private val dsOutputLock = Any()
	// 缓存最近一次触发器配置，rumble 下发时一并写入 0x02 报告，避免覆盖触发器状态
	private var dsLeftTriggerType: Int = 0
	private var dsRightTriggerType: Int = 0
	private var dsLeftTriggerData: ByteArray = ByteArray(10)
	private var dsRightTriggerData: ByteArray = ByteArray(10)

	private var currentState = ControllerState()

	private val hapticsState = AudioHapticsState()
	private val btRumbleHandler = Handler(Looper.getMainLooper())
	private var btZeroResendRunnable: Runnable? = null

	fun setControllerState(controllerState: ControllerState) {
//		Log.d("StreamView", "session setControllerState: $controllerState")
		session?.setControllerState(controllerState)
		currentState = controllerState.copy()

		if (usbMode) {
			if (controllerState.leftX > 1 || controllerState.leftY > 1 || controllerState.rightX > 1 || controllerState.rightY > 1) {
				if (controllerState.buttons > 0u || controllerState.l2State > 25U || controllerState.r2State > 25U) {
					hapticsState.lastActionTime = System.currentTimeMillis()
				}
			}
		} else {
			if (controllerState.buttons > 0u || controllerState.l2State > 25U || controllerState.r2State > 25U) {
				hapticsState.lastActionTime = System.currentTimeMillis()
			}
		}
	}

	fun shutdown()
	{
		btZeroResendRunnable?.let { btRumbleHandler.removeCallbacks(it) }
		btZeroResendRunnable = null

		session?.stop()
		session?.dispose()
		session = null
		_state.value = StreamStateIdle
		//surfaceTexture?.release()

		// 断流时关闭触觉模式，避免控制器停在异常状态
		if (usbMode && usbController == DSCONTROLLER_NAME) {
			getMainActivity()?.stopHaptics()
		}

		// 停止 rumble
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

	private fun triggerDataToWritableArray(data: ByteArray) = Arguments.createArray().apply {
		data.forEach { pushInt(it.toInt() and 0xFF) }
	}

	private fun normalizeTriggerData10(data: ByteArray): ByteArray {
		// 触发器参数固定按 10 字节存储，不足补 0，超出截断
		val out = ByteArray(10)
		val size = minOf(data.size, out.size)
		System.arraycopy(data, 0, out, 0, size)
		return out
	}

	private fun updateDualSenseTriggerCache(
		leftType: Int,
		leftData: ByteArray,
		rightType: Int,
		rightData: ByteArray,
	) {
		// 更新缓存，供 rumble 直下发时复用
		synchronized(dsOutputLock) {
			dsLeftTriggerType = leftType and 0xFF
			dsRightTriggerType = rightType and 0xFF
			dsLeftTriggerData = normalizeTriggerData10(leftData)
			dsRightTriggerData = normalizeTriggerData10(rightData)
		}
	}

	private fun buildDualSenseOutputReport(rumbleHeavy: Int, rumbleSoft: Int): ByteArray {
		val leftType: Int
		val rightType: Int
		val leftData: ByteArray
		val rightData: ByteArray

		synchronized(dsOutputLock) {
			leftType = dsLeftTriggerType
			rightType = dsRightTriggerType
			leftData = dsLeftTriggerData.copyOf()
			rightData = dsRightTriggerData.copyOf()
		}

		// 组装 48 字节 DualSense 输出报告（ID=0x02）
		return byteArrayOf(
			0x02,
			0xFF.toByte(),
			0xF7.toByte(),
			rumbleSoft.coerceIn(0, 255).toByte(),
			rumbleHeavy.coerceIn(0, 255).toByte(),
			0x00, 0x00, 0x00, 0x00,
			0x00,
			0x10,
			(rightType and 0xFF).toByte(),
			rightData[0], rightData[1], rightData[2], rightData[3], rightData[4],
			rightData[5], rightData[6], rightData[7], rightData[8], rightData[9],
			(leftType and 0xFF).toByte(),
			leftData[0], leftData[1], leftData[2], leftData[3], leftData[4],
			leftData[5], leftData[6], leftData[7], leftData[8], leftData[9],
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x04, // valid_flag2
			0x02,
			0x00,
			0x02, // lightbar_setup
			0x00, // player_light
			0x00, // player_led
			0x00, 0x00, 0x00 // RGB
		)
	}

	private fun sendDualSenseRumbleDirect(left: Int, right: Int) {
		val heavy = left.coerceIn(0, 255)
		val soft = right.coerceIn(0, 255)
		val report = buildDualSenseOutputReport(heavy, soft)
		// 直接走原生链路下发，避免经过 JS 事件回环
		getMainActivity()?.handleSendCommand(report)
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
//				Log.d("StreamView", "RumbleEvent: $event")
				if (rumble) {
					// 若 DualSense 触觉已激活，跳过 rumble 降级逻辑，避免叠加振动
					if (usbMode && usbController == DSCONTROLLER_NAME) {
						val hapticsActive = getMainActivity()?.isDualSenseHapticsActive() ?: false
						if (hapticsActive) {
							return
						}
					}

					val currentTime = System.currentTimeMillis()
					var left = event.left.coerceIn(0, 255)
					var right = event.right.coerceIn(0, 255)
					var peakl = event.peakl.coerceIn(0, 255)
					var peakr = event.peakr.coerceIn(0, 255)

					if (left < RUMBLE_MIN_LEVEL) {
						left = 0
					}
					if (right < RUMBLE_MIN_LEVEL) {
						right = 0
					}

					val shouldVibrate = (left > 0 || right > 0)
					val shouldStop = hapticsState.isVibrating && !shouldVibrate

					// 变化太小时直接丢弃，避免无效刷写
					if (!shouldStop &&
						abs(left - lastProcessedEvent.left) <= 1 &&
						abs(right - lastProcessedEvent.right) <= 1) {
						return
					}

					hapticsState.isVibrating = shouldVibrate
					hapticsState.lastLeft = left
					hapticsState.lastRight = right
					lastProcessedEvent = RumbleEvent(left, right)

					if (usbMode) {
						if (usbController == DSCONTROLLER_NAME) {
							sendDualSenseRumbleDirect(left, right)
						} else {
							val INPUT_MAX = 256
							val OUTPUT_MAX = 32767
							val outLeft = (left * OUTPUT_MAX / INPUT_MAX).coerceIn(0, OUTPUT_MAX)
							val outRight = (right * OUTPUT_MAX / INPUT_MAX).coerceIn(0, OUTPUT_MAX)
							getMainActivity()?.handleRumble(outLeft.toShort(), outRight.toShort())
						}
					}
					else {
							val gamepadManager = Gamepad(reactContext)
							val btLow = left.coerceIn(0, 255)
							val btHigh = right.coerceIn(0, 255)
							btZeroResendRunnable?.let { btRumbleHandler.removeCallbacks(it) }
							btZeroResendRunnable = null

							val diff = currentTime - hapticsState.lastActionTime
							// Rumble with click action
							if ((diff < 1500L) && (left == 0 && right == 0) && (peakl > RUMBLE_MIN_LEVEL || peakr > RUMBLE_MIN_LEVEL)) {
								vibrateScope.launch {
									vibrateMutex.withLock {
										gamepadManager.vibrate(BT_RUMBLE_DURATION_MS, peakr, peakl, 0, 0, rumbleIntensity)
										delay(20)
										gamepadManager.vibrate(BT_RUMBLE_DURATION_MS, 0, 0, 0, 0, rumbleIntensity)
									}
								}
							} else {
								vibrateScope.launch {
									vibrateMutex.withLock {
										gamepadManager.vibrate(BT_RUMBLE_DURATION_MS, btHigh, btLow, 0, 0, rumbleIntensity)
										delay(20)
										gamepadManager.vibrate(BT_RUMBLE_DURATION_MS, 0, 0, 0, 0, rumbleIntensity)
									}
								}
							}
						}
					}
				}
			is HapticAudioEvent -> { // 触觉反馈
				// 仅在 USB DualSense 模式下转发原始触觉音频
				if (usbMode && usbController == DSCONTROLLER_NAME) {
					getMainActivity()?.handleHapticAudio(
						event.pcmData,
						hapticFeedbackIntensity.toFloat()
					)
				}
			}
			is TriggerRumbleEvent -> { // 自适应扳机
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

					if (usbController == DSCONTROLLER_NAME) {
						// 为 rumble 直下发同步最新触发器参数
						updateDualSenseTriggerCache(left_type, left_data, right_type, right_data)
					}

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
