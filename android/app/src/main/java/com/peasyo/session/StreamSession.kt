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
import com.peasyo.lib.ConnectInfo
import com.peasyo.lib.ConnectedEvent
import com.peasyo.lib.ControllerState
import com.peasyo.lib.CreateError
import com.peasyo.lib.Event
import com.peasyo.lib.LoginPinRequestEvent
import com.peasyo.lib.PerformanceEvent
import com.peasyo.lib.QuitEvent
import com.peasyo.lib.QuitReason
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

class StreamSession(val connectInfo: ConnectInfo, val logManager: LogManager, val logVerbose: Boolean, private val reactContext: ReactContext?, val rumble: Boolean, val rumbleIntensity: Int, val usbMode: Boolean, val usbController: String)
{
	var session: Session? = null
		private set

	private val _state = MutableLiveData<StreamState>(StreamStateIdle)
	val state: LiveData<StreamState> get() = _state

	private var surfaceTexture: SurfaceTexture? = null
	private var surface: Surface? = null

	private val vibrateMutex = Mutex()
	private val vibrateScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

	private val STABLE_THRESHOLD = 3         // 判定为稳定需要的次数
	private val VALUE_CHANGE_THRESHOLD = 5   // 数值变化阈值(百分比)
	private val EVENT_COOLDOWN_MS = 50L      // 事件发送冷却时间(毫秒)
	private val CHANNEL_DIFF_THRESHOLD = 10

	private val DSCONTROLLER_NAME = "DualSenseController"

	private data class AudioHapticsState(
		var lastLeft: Int = 0,
		var lastRight: Int = 0,
		var stableLeft: Int = 0,
		var stableRight: Int = 0,
		var stableCount: Int = 0,
		var isInitialized: Boolean = false,
		var isVibrating: Boolean = false,
		var lastEventTime: Long = System.currentTimeMillis(),
		var lastActionTime: Long = System.currentTimeMillis()
	)

	private var lastProcessedEvent = RumbleEvent(0, 0)

	private var currentState = ControllerState()

	private val hapticsState = AudioHapticsState()

	fun setControllerState(controllerState: ControllerState) {
//		Log.d("StreamView", "session setControllerState: $controllerState")
		session?.setControllerState(controllerState)
		currentState = controllerState.copy()

		if (usbMode) {
			if (controllerState.leftX > 1 || controllerState.leftY > 1 || controllerState.rightX > 1 || controllerState.rightY > 1) {
				val leftx = if (controllerState.leftX > 1) {
					(controllerState.leftX.toInt() and 0xFFFF).toFloat() / 65535f
				} else {
					0f
				}
				val lefty = if (controllerState.leftY > 1) {
					(controllerState.leftY.toInt() and 0xFFFF).toFloat() / 65535f
				} else {
					0f
				}
				val rightx = if (controllerState.rightX > 1) {
					(controllerState.rightX.toInt() and 0xFFFF).toFloat() / 65535f
				} else {
					0f
				}
				val righty = if (controllerState.rightY > 1) {
					(controllerState.rightY.toInt() and 0xFFFF).toFloat() / 65535f
				} else {
					0f
				}

				if (controllerState.buttons > 0u || controllerState.l2State > 25U || controllerState.r2State > 25U || leftx > 0.2 || lefty > 0.2 || rightx > 0.2 || righty > 0.2) {
					hapticsState.lastActionTime = System.currentTimeMillis()
				}
			}
		} else {
			if (controllerState.buttons > 0u || controllerState.l2State > 25U || controllerState.r2State > 25U || controllerState.leftX > 0.2 || controllerState.leftY > 0.2 || controllerState.rightX > 0.2 || controllerState.rightY > 0.2) {
				hapticsState.lastActionTime = System.currentTimeMillis()
			}
		}
	}

	fun shutdown()
	{
		session?.stop()
		session?.dispose()
		session = null
		_state.value = StreamStateIdle
		//surfaceTexture?.release()

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
			session.start()
			val surface = surface
			if(surface != null)
				session.setSurface(surface)
			this.session = session
		}
		catch(e: CreateError)
		{
			_state.value = StreamStateCreateError(e)
		}
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

	private fun eventCallback(event: Event)
	{
		when(event)
		{
			is ConnectedEvent -> { // 连接成功
				_state.postValue(StreamStateConnected)

				val params = Arguments.createMap().apply {
					putString("type", "connected")
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
				sendEvent("streamStateChange", params)
			}
			is RumbleEvent -> {
//				Log.d("StreamView", "RumbleEvent: $event")
				if (rumble) {

					val currentTime = System.currentTimeMillis()
					var shouldVibrate = false
					var left = event.left
					var right = event.right

					val canSendEvent = (currentTime - hapticsState.lastEventTime) >= EVENT_COOLDOWN_MS

					if (canSendEvent) {
						// Situation1：left != right
						if (abs(left - right) > CHANNEL_DIFF_THRESHOLD && left > 0 && right > 0) {
							shouldVibrate = true
//							Log.d("StreamView", "Vibration triggered by Situation1: L=${left}, R=${right}")
						}

						// Situation2：rumble change
						if (!shouldVibrate && hapticsState.isInitialized) {
							val leftChange = if (hapticsState.stableLeft > 0 && left > 0) {
								abs((left - hapticsState.stableLeft).toFloat() / hapticsState.stableLeft) * 100
							} else 0f

							val rightChange = if (hapticsState.stableRight > 0 && right > 0) {
								abs((right - hapticsState.stableRight).toFloat() / hapticsState.stableRight) * 100
							} else 0f

							if ((leftChange > VALUE_CHANGE_THRESHOLD && leftChange < 30) ||
								(rightChange > VALUE_CHANGE_THRESHOLD && rightChange < 30)) {
								shouldVibrate = true
								hapticsState.stableCount = 0
//								Log.d("StreamView", "Vibration triggered by sudden change: L=${leftChange}%, R=${rightChange}%")
							}
						}

						// Situation3：Rumble with click
						val diff = currentTime - hapticsState.lastActionTime
						if (!shouldVibrate && (diff < 1500L) && (left > 0 || right > 0)) {
							shouldVibrate = true
//							Log.d("StreamView", "Vibration triggered by Situation3: L=${left}%, R=${right}%")
						}
					}

					if (abs(left - hapticsState.lastLeft) <= VALUE_CHANGE_THRESHOLD &&
						abs(right - hapticsState.lastRight) <= VALUE_CHANGE_THRESHOLD) {
						hapticsState.stableCount++
						if (hapticsState.stableCount >= STABLE_THRESHOLD) {
							hapticsState.stableLeft = left
							hapticsState.stableRight = right
							hapticsState.isInitialized = true
						}
					} else {
						hapticsState.stableCount = 0
					}

					if ((shouldVibrate || (hapticsState.isVibrating && (left == 0 && right == 0))) && canSendEvent) {
						hapticsState.isVibrating = shouldVibrate
						hapticsState.lastEventTime = currentTime

						if (abs(event.left - lastProcessedEvent.left) <= 0  && abs(event.right - lastProcessedEvent.right) <= 0 ) {
							return
						}

						lastProcessedEvent = event

						if (left > right) {
							right = left
						}

						if (right > left) {
							left = right
						}

						if (left < 10) {
							left = 0
						}

						if (right < 10) {
							right = 0
						}

//						Log.d("StreamView", "RumbleEvent: $event")

						if (shouldVibrate) {
							if (usbMode) {
								if (usbController == DSCONTROLLER_NAME) {
									val params = Arguments.createMap().apply {
										putInt("left", left)
										putInt("right", right)
									}
									val params0 = Arguments.createMap().apply {
										putInt("left", 0)
										putInt("right", 0)
									}
									vibrateScope.launch {
										vibrateMutex.withLock {
											sendEvent("dsRumble", params)
											delay(30)
											sendEvent("dsRumble", params0)
										}
									}
								} else {
									val INPUT_MAX = 256
									val OUTPUT_MAX = 32767

									val left = (event.left * OUTPUT_MAX / INPUT_MAX).coerceAtMost(OUTPUT_MAX)
									val right = (event.right * OUTPUT_MAX / INPUT_MAX).coerceAtMost(OUTPUT_MAX)

									getMainActivity()?.handleRumble(left.toShort(), right.toShort())

									vibrateScope.launch {
										vibrateMutex.withLock {
											getMainActivity()?.handleRumble(left.toShort(), right.toShort())
											delay(50)
											getMainActivity()?.handleRumble(0, 0)
										}
									}
								}
							} else {
								var gamepadManager = Gamepad(reactContext)
								if(left == 0 || right == 0) {
									gamepadManager.vibrate(50, left, right, 0, 0, rumbleIntensity)
								} else {
//									val params = Arguments.createMap().apply {
//										putInt("left", left)
//										putInt("right", right)
//									}
//									sendEvent("rumble", params)
									vibrateScope.launch {
										vibrateMutex.withLock {
											gamepadManager.vibrate(50, left, right, 0, 0, rumbleIntensity)
											delay(50)
											gamepadManager.vibrate(0, 0, 0, 0, 0, rumbleIntensity)
										}
									}
								}
							}
						}
					}
				}
			}
			is TriggerRumbleEvent -> { // Adaptive trigger
//				Log.d("StreamView", "TriggerRumbleEvent: $event")

				if (usbMode) {
					val left_type = event.typeLeft
					val left_data = event.left
					val right_type = event.typeLeft
					val right_data = event.left

					val params = Arguments.createMap().apply {
						putInt("leftType", left_type)
						putInt("leftData", left_data)
						putInt("rightType", right_type)
						putInt("rightData", right_data)
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
				session?.setSurface(currentSurface)
			}
		}

		surfaceView.holder.addCallback(object: SurfaceHolder.Callback {
			override fun surfaceCreated(holder: SurfaceHolder) { }

			override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int)
			{
				val surface = holder.surface
				Log.d("StreamView", "surfaceChanged:" + surface)
				this@StreamSession.surface = surface
				session?.setSurface(surface)
			}

			override fun surfaceDestroyed(holder: SurfaceHolder)
			{
				Log.d("StreamView", "surfaceDestroyed:" + surface)
				this@StreamSession.surface = null
				session?.setSurface(null)
			}
		})
	}

	// Only for textureview mode
	fun handleSessionSetSurface(surface: SurfaceTexture) {
		Log.d("StreamView", "handleSessionSetSurface")
		surfaceTexture = surface
		this@StreamSession.surface = Surface(surfaceTexture)
		// 在 onSurfaceTextureAvailable() 方法里面取得 SurfaceTexture 并包装成一个 Surface 再调用MediaPlayer的 setSurface 方法完成播放器的显示工作
		session?.setSurface(Surface(surface))
	}
}