package com.peasyo.lib

import android.os.Parcelable
import android.util.Log
import android.view.Surface
import kotlinx.parcelize.Parcelize
import java.lang.Exception
import java.lang.NumberFormatException
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets
import kotlin.math.abs

enum class Target(val value: Int)
{
	PS4_UNKNOWN(0),
	PS4_8(800),
	PS4_9(900),
	PS4_10(1000),
	PS5_UNKNOWN(1000000),
	PS5_1(1000100);

	companion object
	{
		@JvmStatic
		fun fromValue(value: Int) = values().firstOrNull { it.value == value } ?: PS4_10
	}

	val isPS5 get() = value >= PS5_UNKNOWN.value
}

enum class VideoResolutionPreset(val value: Int)
{
	RES_360P(1),
	RES_540P(2),
	RES_720P(3),
	RES_1080P(4)
}

enum class VideoFPSPreset(val value: Int)
{
	FPS_30(30),
	FPS_60(60)
}

enum class Codec(val value: Int)
{
	CODEC_H264(0),
	CODEC_H265(1),
	CODEC_H265_HDR(2)
}

@Parcelize
data class ConnectVideoProfile(
	val width: Int,
	val height: Int,
	val maxFPS: Int,
	val bitrate: Int,
	val codec: Codec
): Parcelable
{
	companion object
	{
		fun preset(resolutionPreset: VideoResolutionPreset, fpsPreset: VideoFPSPreset, codec: Codec)
				= ChiakiNative.videoProfilePreset(resolutionPreset.value, fpsPreset.value, codec)
	}
}

@Parcelize
data class ConnectInfo(
	val ps5: Boolean,
	val host: String,
	val parsedHost: String,
	val registKey: ByteArray,
	val morning: ByteArray,
	val videoProfile: ConnectVideoProfile,
	val enableKeyboard: Boolean
): Parcelable

private class ChiakiNative
{
	data class CreateResult(var errorCode: Int, var ptr: Long)
	companion object
	{
		init
		{
			System.loadLibrary("chiaki-jni")
		}
		@JvmStatic external fun hello(value: Int): String
		@JvmStatic external fun errorCodeToString(value: Int): String
		@JvmStatic external fun quitReasonToString(value: Int): String
		@JvmStatic external fun quitReasonIsError(value: Int): Boolean
		@JvmStatic external fun videoProfilePreset(resolutionPreset: Int, fpsPreset: Int, codec: Codec): ConnectVideoProfile
		@JvmStatic external fun getRtt(ptr: Long): Double
		@JvmStatic external fun getMeasuredBitrate(ptr: Long): Double
		@JvmStatic external fun getPacketLoss(ptr: Long): Double
		@JvmStatic external fun getDecodeTime(ptr: Long): Double
		@JvmStatic external fun getFps(ptr: Long): Double
		@JvmStatic external fun getFrameLost(ptr: Long): Double
		@JvmStatic external fun getDeviceUid(): String
		@JvmStatic external fun sessionCreate(result: CreateResult, connectInfo: ConnectInfo, logFile: String?, logVerbose: Boolean, javaSession: Session)
		@JvmStatic external fun sessionFree(ptr: Long)
		@JvmStatic external fun sessionStart(ptr: Long): Int
		@JvmStatic external fun sessionStop(ptr: Long): Int
		@JvmStatic external fun sessionGotoBed(ptr: Long): Int
		@JvmStatic external fun sessionKeyboardAccept(ptr: Long): Int
		@JvmStatic external fun sessionSetText(ptr: Long, text: String): Int
		@JvmStatic external fun sessionKeyboardReject(ptr: Long): Int
		@JvmStatic external fun sessionJoin(ptr: Long): Int
		@JvmStatic external fun sessionSetSurface(ptr: Long, surface: Surface?)
		@JvmStatic external fun sessionSetControllerState(ptr: Long, controllerState: ControllerState)
		@JvmStatic external fun sessionSetSensorState(ptr: Long)
		@JvmStatic external fun sessionSetLoginPin(ptr: Long, pin: String)
		@JvmStatic external fun registStart(result: CreateResult, registInfo: RegistInfo, javaLog: ChiakiLog, javaRegist: Regist)
		@JvmStatic external fun registStop(ptr: Long)
		@JvmStatic external fun registFree(ptr: Long)
	}
}

// 测试方法，用于测试java -> kotlin -> c调用
class Hello(val value: Int)
{
	// chiaki-jni.c(103) -> JNICALL JNI_FCN(hello)
	fun say() = ChiakiNative.hello(value)
}

class ErrorCode(val value: Int)
{
	override fun toString() = ChiakiNative.errorCodeToString(value)
	var isSuccess = value == 0
}

class ChiakiLog(val levelMask: Int, val callback: (level: Int, text: String) -> Unit)
{
	companion object
	{
		fun formatLog(level: Int, text: String) =
			"[${when(level)
				{
					Level.DEBUG.value -> "D"
					Level.VERBOSE.value -> "V"
					Level.INFO.value -> "I"
					Level.WARNING.value -> "W"
					Level.ERROR.value -> "E"
					else -> "?"
				}
			}] $text"
	}

	enum class Level(val value: Int)
	{
		DEBUG(1 shl 4),
		VERBOSE(1 shl 3),
		INFO(1 shl 2),
		WARNING(1 shl 1),
		ERROR(1 shl 0),
		ALL(0.inv())
	}

	private fun log(level: Int, text: String)
	{
		callback(level, text)
	}

	fun d(text: String) = log(Level.DEBUG.value, text)
	fun v(text: String) = log(Level.VERBOSE.value, text)
	fun i(text: String) = log(Level.INFO.value, text)
	fun w(text: String) = log(Level.WARNING.value, text)
	fun e(text: String) = log(Level.ERROR.value, text)
}

private fun maxAbs(a: Short, b: Short) = if(abs(a.toInt()) > abs(b.toInt())) a else b

private val CONTROLLER_TOUCHES_MAX = 2 // must be the same as CHIAKI_CONTROLLER_TOUCHES_MAX

data class ControllerTouch (
	var x: Short = 0,
	var y: Short = 0,
	var id: Byte = -1 // -1 = up
)

data class ControllerState constructor(
	@get:JvmName("getButtons")
	@set:JvmName("setButtons")
	var buttons: UInt = 0U,

	@get:JvmName("getL2State")
	@set:JvmName("setL2State")
	var l2State: UByte = 0U,

	@set:JvmName("setR2State")
	var r2State: UByte = 0U,

	@set:JvmName("setLeftX")
	var leftX: Short = 0,

	@set:JvmName("setLeftY")
	var leftY: Short = 0,

	@set:JvmName("setRightX")
	var rightX: Short = 0,

	@set:JvmName("setRightY")
	var rightY: Short = 0,

	@set:JvmName("setTouchIdNext")
	var touchIdNext: UByte = 0U,

	@set:JvmName("setTouches")
	var touches: Array<ControllerTouch> = arrayOf(ControllerTouch(), ControllerTouch()),

	@get:JvmName("getGyroX")
	@set:JvmName("setGyroX")
	var gyroX: Float = 0.0f,

	@get:JvmName("getGyroY")
	@set:JvmName("setGyroY")
	var gyroY: Float = 0.0f,

	@get:JvmName("getGyroZ")
	@set:JvmName("setGyroZ")
	var gyroZ: Float = 0.0f,

	@get:JvmName("getAccelX")
	@set:JvmName("setAccelX")
	var accelX: Float = 0.0f,

	@get:JvmName("getAccelY")
	@set:JvmName("setAccelY")
	var accelY: Float = 1.0f,

	@get:JvmName("getAccelZ")
	@set:JvmName("setAccelZ")
	var accelZ: Float = 0.0f,

	@get:JvmName("getOrientX")
	@set:JvmName("setOrientX")
	var orientX: Float = 0.0f,

	@get:JvmName("getOrientY")
	@set:JvmName("setOrientY")
	var orientY: Float = 0.0f,

	@get:JvmName("getOrientZ")
	@set:JvmName("setOrientZ")
	var orientZ: Float = 0.0f,

	@get:JvmName("getOrientW")
	@set:JvmName("setOrientW")
	var orientW: Float = 1.0f
){
	companion object
	{
		@JvmStatic
		fun init(): ControllerState {
			return ControllerState()
		}
		@JvmStatic
		val BUTTON_CROSS 		= (1 shl 0).toUInt()
		val BUTTON_MOON 		= (1 shl 1).toUInt()
		val BUTTON_BOX 			= (1 shl 2).toUInt()
		val BUTTON_PYRAMID 		= (1 shl 3).toUInt()
		val BUTTON_DPAD_LEFT 	= (1 shl 4).toUInt()
		val BUTTON_DPAD_RIGHT	= (1 shl 5).toUInt()
		val BUTTON_DPAD_UP 		= (1 shl 6).toUInt()
		val BUTTON_DPAD_DOWN 	= (1 shl 7).toUInt()
		val BUTTON_L1 			= (1 shl 8).toUInt()
		val BUTTON_R1 			= (1 shl 9).toUInt()
		val BUTTON_L3			= (1 shl 10).toUInt()
		val BUTTON_R3			= (1 shl 11).toUInt()
		val BUTTON_OPTIONS		= (1 shl 12).toUInt()
		val BUTTON_SHARE 		= (1 shl 13).toUInt()
		val BUTTON_TOUCHPAD		= (1 shl 14).toUInt()
		val BUTTON_PS			= (1 shl 15).toUInt()
		val TOUCHPAD_WIDTH: UShort = 1920U
		val TOUCHPAD_HEIGHT: UShort = 942U
	}

	infix fun or(o: ControllerState) = ControllerState(
		buttons = buttons or o.buttons,
		l2State = maxOf(l2State, o.l2State),
		r2State = maxOf(r2State, o.r2State),
		leftX = maxAbs(leftX, o.leftX),
		leftY = maxAbs(leftY, o.leftY),
		rightX = maxAbs(rightX, o.rightX),
		rightY = maxAbs(rightY, o.rightY),
		touches = touches.zip(o.touches) { a, b -> if(a.id >= 0) a else b }.toTypedArray(),
		gyroX = gyroX,
		gyroY = gyroY,
		gyroZ = gyroZ,
		accelX = accelX,
		accelY = accelY,
		accelZ = accelZ,
		orientX = orientX,
		orientY = orientY,
		orientZ = orientZ,
		orientW = orientW
	)

	override fun equals(other: Any?): Boolean
	{
		if(this === other) return true
		if(javaClass != other?.javaClass) return false

		other as ControllerState

		if(buttons != other.buttons) return false
		if(l2State != other.l2State) return false
		if(r2State != other.r2State) return false
		if(leftX != other.leftX) return false
		if(leftY != other.leftY) return false
		if(rightX != other.rightX) return false
		if(rightY != other.rightY) return false
		if(touchIdNext != other.touchIdNext) return false
		if(!touches.contentEquals(other.touches)) return false
		if(gyroX != other.gyroX) return false
		if(gyroY != other.gyroY) return false
		if(gyroZ != other.gyroZ) return false
		if(accelX != other.accelX) return false
		if(accelY != other.accelY) return false
		if(accelZ != other.accelZ) return false
		if(orientX != other.orientX) return false
		if(orientY != other.orientY) return false
		if(orientZ != other.orientZ) return false
		if(orientW != other.orientW) return false

		return true
	}

	override fun hashCode(): Int
	{
		var result = buttons.hashCode()
		result = 31 * result + l2State.hashCode()
		result = 31 * result + r2State.hashCode()
		result = 31 * result + leftX
		result = 31 * result + leftY
		result = 31 * result + rightX
		result = 31 * result + rightY
		result = 31 * result + touchIdNext.hashCode()
		result = 31 * result + touches.contentHashCode()
		result = 31 * result + gyroX.hashCode()
		result = 31 * result + gyroY.hashCode()
		result = 31 * result + gyroZ.hashCode()
		result = 31 * result + accelX.hashCode()
		result = 31 * result + accelY.hashCode()
		result = 31 * result + accelZ.hashCode()
		result = 31 * result + orientX.hashCode()
		result = 31 * result + orientY.hashCode()
		result = 31 * result + orientZ.hashCode()
		result = 31 * result + orientW.hashCode()
		return result
	}
}

class QuitReason(val value: Int)
{
	override fun toString() = ChiakiNative.quitReasonToString(value)

	val isError = ChiakiNative.quitReasonIsError(value)
}

sealed class Event
object ConnectedEvent: Event()
data class LoginPinRequestEvent(val pinIncorrect: Boolean): Event()
data class QuitEvent(val reason: QuitReason, val reasonString: String?): Event()
data class RumbleEvent(val left: Int, val right: Int): Event()
data class TriggerRumbleEvent(val typeLeft: Int, val left: Int, val typeRight: Int, val right: Int): Event()
data class PerformanceEvent(val rtt: Double, val bitrate: Double, val packetLoss: Double, val decodeTime: Double, val fps: Double, val frameLost: Double): Event()
class CreateError(val errorCode: ErrorCode): Exception("Failed to create a native object: $errorCode")

class Session(connectInfo: ConnectInfo, logFile: String?, logVerbose: Boolean)
{
	interface EventCallback
	{
		fun sessionEvent(event: Event)
	}

	private var nativePtr: Long
	var eventCallback: ((event: Event) -> Unit)? = null

	init
	{
		val result = ChiakiNative.CreateResult(0, 0)
		ChiakiNative.sessionCreate(result, connectInfo, logFile, logVerbose, this)
		val errorCode = ErrorCode(result.errorCode)
		if(!errorCode.isSuccess)
			throw CreateError(errorCode)
		nativePtr = result.ptr
	}

	fun start() = ErrorCode(ChiakiNative.sessionStart(nativePtr))
	fun stop() = ErrorCode(ChiakiNative.sessionStop(nativePtr))
	fun gotoBed() = ErrorCode(ChiakiNative.sessionGotoBed(nativePtr))

	fun sessionKeyboardAccept() = ErrorCode(ChiakiNative.sessionKeyboardAccept(nativePtr))
	fun setText(text: String) = ErrorCode(ChiakiNative.sessionSetText(nativePtr, text))

	fun sessionKeyboardReject() = ErrorCode(ChiakiNative.sessionKeyboardReject(nativePtr))

	fun dispose()
	{
		if(nativePtr == 0L)
			return
		ChiakiNative.sessionJoin(nativePtr)
		ChiakiNative.sessionFree(nativePtr)
		nativePtr = 0L
	}

	private fun event(event: Event)
	{
		eventCallback?.let { it(event) }
	}

	private fun eventConnected()
	{
		event(ConnectedEvent)
	}

	private fun eventLoginPinRequest(pinIncorrect: Boolean)
	{
		event(LoginPinRequestEvent(pinIncorrect))
	}

	private fun eventQuit(reasonValue: Int, reasonString: String?)
	{
		event(QuitEvent(QuitReason(reasonValue), reasonString))
	}

	// 接收振动反馈
	// 该方法在android/app/src/main/cpp/chiaki-jni.c调用
	private fun eventRumble(left: Int, right: Int)
	{
		event(RumbleEvent(left, right))
	}

	// Adaptive trigger
	private fun eventRumbleTigger(typeLeft: Int, left: Int, typeRight: Int, right: Int)
	{
		event(TriggerRumbleEvent(typeLeft, left, typeRight, right))
	}

	fun getPerformance()
	{
		val rtt = ChiakiNative.getRtt(nativePtr)
		val bitrate = ChiakiNative.getMeasuredBitrate(nativePtr)
		val packetLoss = ChiakiNative.getPacketLoss(nativePtr)
		val decodeTime = ChiakiNative.getDecodeTime(nativePtr)
		val fps = ChiakiNative.getFps(nativePtr)
		val frameLost = ChiakiNative.getFrameLost(nativePtr)

		event(PerformanceEvent(rtt, bitrate, packetLoss, decodeTime, fps, frameLost))
	}

	fun setSurface(surface: Surface?)
	{
		ChiakiNative.sessionSetSurface(nativePtr, surface)
	}

	fun setControllerState(controllerState: ControllerState)
	{
		ChiakiNative.sessionSetControllerState(nativePtr, controllerState)
	}

	fun setSensorState() {
		ChiakiNative.sessionSetSensorState(nativePtr)
	}

	fun setLoginPin(pin: String)
	{
		ChiakiNative.sessionSetLoginPin(nativePtr, pin)
	}
}

data class DiscoveryHost(
	val state: State,
	val hostRequestPort: UShort,
	val hostAddr: String?,
	val systemVersion: String?,
	val deviceDiscoveryProtocolVersion: String?,
	val hostName: String?,
	val hostType: String?,
	val hostId: String?,
	val runningAppTitleid: String?,
	val runningAppName: String?)
{
	enum class State
	{
		UNKNOWN,
		READY,
		STANDBY
	}
	
	val isPS5 get() = deviceDiscoveryProtocolVersion == "00030010"
}


data class DiscoveryServiceOptions(
	val hostsMax: ULong,
	val hostDropPings: ULong,
	val pingMs: ULong,
	val sendAddr: InetSocketAddress
)

@Parcelize
data class RegistInfo(
	val target: Target,
	val host: String,
	val broadcast: Boolean,
	val psnOnlineId: String?,
	val psnAccountId: ByteArray?,
	val pin: Int
): Parcelable
{
	companion object
	{
		const val ACCOUNT_ID_SIZE = 8
	}
}

data class RegistHost(
	val target: Target,
	val apSsid: String,
	val apBssid: String,
	val apKey: String,
	val apName: String,
	val serverMac: ByteArray,
	val serverNickname: String,
	val rpRegistKey: ByteArray,
	val rpKeyType: UInt,
	val rpKey: ByteArray
)

sealed class RegistEvent
object RegistEventCanceled: RegistEvent()
object RegistEventFailed: RegistEvent()
class RegistEventSuccess(val host: RegistHost): RegistEvent()

// 注册
class Regist(
	info: RegistInfo, // 相关注册信息
	log: ChiakiLog,
	val callback: (RegistEvent) -> Unit
)
{
	private var nativePtr: Long

	init
	{
		val result = ChiakiNative.CreateResult(0, 0)
		ChiakiNative.registStart(result, info, log, this)
		val errorCode = ErrorCode(result.errorCode)
		if(!errorCode.isSuccess)
			throw CreateError(errorCode)
		nativePtr = result.ptr
	}

	fun stop()
	{
		ChiakiNative.registStop(nativePtr)
	}

	fun dispose()
	{
		if(nativePtr == 0L)
			return
		ChiakiNative.registFree(nativePtr)
		nativePtr = 0L
	}

	private fun event(event: RegistEvent)
	{
		callback(event)
	}
}

// remote psn
class RemotePsn {
	private var deviceUid: String = ""

	init {
		deviceUid = ChiakiNative.getDeviceUid()
	}

	fun getDeviceUid(): String {
		return deviceUid
	}
}
