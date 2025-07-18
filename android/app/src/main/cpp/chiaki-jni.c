// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#include <jni.h>

#include <android/log.h>

#include <chiaki/common.h>
#include <chiaki/log.h>
#include <chiaki/session.h>
#include <chiaki/regist.h>

#include <string.h>
#include <linux/in.h>
#include <linux/in6.h>
#include <arpa/inet.h>

#include "video-decoder.h"
#include "audio-decoder.h"
#include "audio-output.h"
#include "controller.h"
#include "log.h"
#include "chiaki-jni.h"

static char *strdup_jni(const char *str)
{
    if(!str)
        return NULL;
    char *r = strdup(str);
    if(!r)
        return NULL;
    for(char *c=r; *c; c++)
    {
        if(*c & (1 << 7))
            *c = '?';
    }
    return r;
}

jobject jnistr_from_ascii(JNIEnv *env, const char *str)
{
    if(!str)
        return NULL;
    char *s = strdup_jni(str);
    if(!s)
        return NULL;
    jobject r = E->NewStringUTF(env, s);
    free(s);
    return r;
}

static jbyteArray jnibytearray_create(JNIEnv *env, const uint8_t *buf, size_t buf_size)
{
    jbyteArray r = E->NewByteArray(env, buf_size);
    E->SetByteArrayRegion(env, r, 0, buf_size, (const jbyte *)buf);
    return r;
}

static jobject get_kotlin_global_object(JNIEnv *env, const char *id)
{
    size_t idlen = strlen(id);
    char *sig = malloc(idlen + 3);
    if(!sig)
        return NULL;
    sig[0] = 'L';
    memcpy(sig + 1, id, idlen);
    sig[1 + idlen] = ';';
    sig[1 + idlen + 1] = '\0';
    jclass cls = E->FindClass(env, id);
    jfieldID field_id = E->GetStaticFieldID(env, cls, "INSTANCE", sig);
    jobject r = E->GetStaticObjectField(env, cls, field_id);
    free(sig);
    return r;
}

static ChiakiLog global_log;
JavaVM *global_vm;

JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
    global_vm = vm;

    android_chiaki_file_log_init(&global_log, CHIAKI_LOG_ALL & ~CHIAKI_LOG_VERBOSE, NULL);
    CHIAKI_LOGI(&global_log, "Loading Chiaki Library");
    ChiakiErrorCode err = chiaki_lib_init();
    CHIAKI_LOGI(&global_log, "Chiaki Library Init Result: %s\n", chiaki_error_string(err));
    return JNI_VERSION;
}

JNIEnv *attach_thread_jni()
{
    JNIEnv *env;
    int r = (*global_vm)->GetEnv(global_vm, (void **)&env, JNI_VERSION);
    if(r == JNI_OK)
        return env;

    if((*global_vm)->AttachCurrentThread(global_vm, &env, NULL) == 0)
        return env;

    CHIAKI_LOGE(&global_log, "Failed to get JNIEnv from JavaVM or attach");
    return NULL;
}

JNIEXPORT jstring JNICALL JNI_FCN(hello)(JNIEnv *env, jobject obj, jint value)
{
    CHIAKI_LOGE(&global_log, "MainActivity1 test native method...");
    return  E->NewStringUTF(env, "hello world");
}

JNIEXPORT jstring JNICALL JNI_FCN(errorCodeToString)(JNIEnv *env, jobject obj, jint value)
{
    return E->NewStringUTF(env, chiaki_error_string((ChiakiErrorCode)value));
}

JNIEXPORT jstring JNICALL JNI_FCN(quitReasonToString)(JNIEnv *env, jobject obj, jint value)
{
    return E->NewStringUTF(env, chiaki_quit_reason_string((ChiakiQuitReason)value));
}

JNIEXPORT jboolean JNICALL JNI_FCN(quitReasonIsError)(JNIEnv *env, jobject obj, jint value)
{
    return chiaki_quit_reason_is_error(value);
}

JNIEXPORT jobject JNICALL JNI_FCN(videoProfilePreset)(JNIEnv *env, jobject obj, jint resolution_preset, jint fps_preset, jobject codec)
{
    ChiakiConnectVideoProfile profile = { 0 };
    chiaki_connect_video_profile_preset(&profile, (ChiakiVideoResolutionPreset)resolution_preset, (ChiakiVideoFPSPreset)fps_preset);
    jclass profile_class = E->FindClass(env, BASE_PACKAGE"/ConnectVideoProfile");
    jmethodID profile_ctor = E->GetMethodID(env, profile_class, "<init>", "(IIIIL"BASE_PACKAGE"/Codec;)V");
    return E->NewObject(env, profile_class, profile_ctor, profile.width, profile.height, profile.max_fps, profile.bitrate, codec);
}

typedef struct android_chiaki_session_t
{
    ChiakiSession session;
    ChiakiLog *log;
    jobject java_session;
    jclass java_session_class;
    jmethodID java_session_event_connected_meth;
    jmethodID java_session_event_holepunch_meth;
    jmethodID java_session_event_login_pin_request_meth;
    jmethodID java_session_event_quit_meth;
    jmethodID java_session_event_rumble_meth;
    jmethodID java_session_event_rumble_tigger_meth;
    jfieldID java_controller_state_buttons;
    jfieldID java_controller_state_l2_state;
    jfieldID java_controller_state_r2_state;
    jfieldID java_controller_state_left_x;
    jfieldID java_controller_state_left_y;
    jfieldID java_controller_state_right_x;
    jfieldID java_controller_state_right_y;
    jfieldID java_controller_state_touches;
    jfieldID java_controller_state_gyro_x;
    jfieldID java_controller_state_gyro_y;
    jfieldID java_controller_state_gyro_z;
    jfieldID java_controller_state_accel_x;
    jfieldID java_controller_state_accel_y;
    jfieldID java_controller_state_accel_z;
    jfieldID java_controller_state_orient_x;
    jfieldID java_controller_state_orient_y;
    jfieldID java_controller_state_orient_z;
    jfieldID java_controller_state_orient_w;
    jfieldID java_controller_touch_x;
    jfieldID java_controller_touch_y;
    jfieldID java_controller_touch_id;

    AndroidChiakiVideoDecoder video_decoder;
    AndroidChiakiAudioDecoder audio_decoder;
    AndroidChiakiController controller;
    void *audio_output;
} AndroidChiakiSession;

static void android_chiaki_event_cb(ChiakiEvent *event, void *user)
{
    AndroidChiakiSession *session = user;

    JNIEnv *env = attach_thread_jni();
    if(!env)
        return;

    switch(event->type)
    {
        case CHIAKI_EVENT_CONNECTED:
            E->CallVoidMethod(env, session->java_session,
                              session->java_session_event_connected_meth);
            break;
        case CHIAKI_EVENT_LOGIN_PIN_REQUEST:
            E->CallVoidMethod(env, session->java_session,
                              session->java_session_event_login_pin_request_meth,
                              (jboolean)event->login_pin_request.pin_incorrect);
            break;
        case CHIAKI_EVENT_HOLEPUNCH:
        {
            CHIAKI_LOGE(&global_log, "holepunch !! CHIAKI_EVENT_HOLEPUNCH");
            E->CallVoidMethod(env, session->java_session,
                              session->java_session_event_holepunch_meth);
            break;
        }
        case CHIAKI_EVENT_QUIT:
        {
            char *reason_str = strdup_jni(event->quit.reason_str);
            jstring reason_str_java = reason_str ? E->NewStringUTF(env, reason_str) : NULL;
            E->CallVoidMethod(env, session->java_session,
                              session->java_session_event_quit_meth,
                              (jint)event->quit.reason,
                              reason_str_java);
            if(reason_str_java)
                E->DeleteLocalRef(env, reason_str_java);
            free(reason_str);
            break;
        }
        case CHIAKI_EVENT_RUMBLE: // Rumble
            E->CallVoidMethod(env, session->java_session,
                              session->java_session_event_rumble_meth,
                              (jint)event->rumble.left,
                              (jint)event->rumble.right);
            break;
        case CHIAKI_EVENT_TRIGGER_EFFECTS: // Trigger Rumble
            E->CallVoidMethod(env, session->java_session,
                              session->java_session_event_rumble_tigger_meth,
                              (jint)event->trigger_effects.type_left,
                              (jint)(*event->trigger_effects.left),
                              (jint)event->trigger_effects.type_right,
                              (jint)(*event->trigger_effects.right));
            break;
        default:
            break;
    }

    (*global_vm)->DetachCurrentThread(global_vm);
}

// RTT
JNIEXPORT jdouble JNICALL JNI_FCN(getRtt)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return 0;
    return 0;
}

// bitrate
JNIEXPORT jdouble JNICALL JNI_FCN(getMeasuredBitrate)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return 0;
    double measured_bitrate = session->session.stream_connection.measured_bitrate;
    // CHIAKI_LOGI(session->log, "measured_bitrate: %d", measured_bitrate);
    return measured_bitrate;
}

// packet loss
JNIEXPORT jdouble JNICALL JNI_FCN(getPacketLoss)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return 0;
    double packet_loss = session->session.stream_connection.congestion_control.packet_loss;
    // CHIAKI_LOGI(session->log, "packet_loss: %d", packet_loss);
    return packet_loss;
}

// decode time
JNIEXPORT jdouble JNICALL JNI_FCN(getDecodeTime)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return 0;
    double dt = session->video_decoder.avg_decode_time;
    return dt;
}

// FPS
JNIEXPORT jdouble JNICALL JNI_FCN(getFps)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return 0;
    double fps = session->video_decoder.avg_fps;
    return fps;
}

// Frame lost
JNIEXPORT jdouble JNICALL JNI_FCN(getFrameLost)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return 0;
    double lost = session->video_decoder.frames_lost;
    return lost;
}

static inline char nibble_char(uint8_t v)
{
    if(v > 0xf)
        return '0';
    if(v < 0xa)
        return '0' + v;
    return 'a' + v;
}

static inline int8_t nibble_value(char c)
{
    if(c >= '0' && c <= '9')
        return c - '0';
    if(c >= 'a' && c <= 'f')
        return c - 'a' + 0xa;
    if(c >= 'A' && c <= 'F')
        return c - 'A' + 0xa;
    return -1;
}

static inline ChiakiErrorCode parse_hex(uint8_t *buf, size_t *buf_size, const char *hex, size_t hex_size) {
    if (hex_size % 2 != 0)
        return CHIAKI_ERR_INVALID_DATA;
    if (hex_size / 2 > *buf_size)
        return CHIAKI_ERR_BUF_TOO_SMALL;

    for (size_t i = 0; i < hex_size; i += 2) {
        int8_t h = nibble_value(hex[i + 0]);
        if (h < 0)
            return CHIAKI_ERR_INVALID_DATA;
        int8_t l = nibble_value(hex[i + 1]);
        if (l < 0)
            return CHIAKI_ERR_INVALID_DATA;
        buf[i / 2] = (h << 4) | l;
    }
}

static inline ChiakiErrorCode format_hex(char *hex_buf, size_t hex_buf_size, const uint8_t *buf, size_t buf_size)
{
    if(hex_buf_size < buf_size * 2 + 1)
        return CHIAKI_ERR_BUF_TOO_SMALL;

    for(size_t i=0; i<buf_size; i++)
    {
        uint8_t v = buf[i];
        hex_buf[i*2+0] = nibble_char(v >> 4);
        hex_buf[i*2+1] = nibble_char(v & 0xf);
    }
    hex_buf[buf_size*2] = '\0';

    return CHIAKI_ERR_SUCCESS;
}

JNIEXPORT jstring JNICALL JNI_FCN(getDeviceUid)(JNIEnv *env, jobject obj)
{
    size_t duid_size = CHIAKI_DUID_STR_SIZE;
    char duid[duid_size];
    chiaki_holepunch_generate_client_device_uid(duid, &duid_size);
    jstring result = (*env)->NewStringUTF(env, duid);
    return result;
}

JNIEXPORT jstring JNICALL JNI_FCN(getPsnDuid)(JNIEnv *env, jobject obj, jstring token, jboolean isPs5, jstring nickName) {
    CHIAKI_LOGE(&global_log, "holepunch getPsnDuid");

    const char *psn_oauth2_token = (*env)->GetStringUTFChars(env, token, NULL);
    const char *nick_name = (*env)->GetStringUTFChars(env, nickName, NULL);
//    ChiakiHolepunchConsoleType console_type = isPs5 ? CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5 : CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS4;

    ChiakiHolepunchConsoleType console_type = CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5;
    ChiakiHolepunchDeviceInfo *device_info_ps5;
    size_t num_devices_ps5;

    ChiakiErrorCode err = chiaki_holepunch_list_devices(psn_oauth2_token, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5, &device_info_ps5, &num_devices_ps5, &global_log);
    if (err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "holepunch !! Failed to get PS5 devices");
        return (*env)->NewStringUTF(env, "Error: Failed to list devices");
    }
    CHIAKI_LOGE(&global_log, ">> holepunch Found %zu devices\n", num_devices_ps5);

    (*env)->ReleaseStringUTFChars(env, token, psn_oauth2_token);

    for (size_t i = 0; i < num_devices_ps5; i++)
    {
        ChiakiHolepunchDeviceInfo dev = device_info_ps5[i];
        char duid_str[sizeof(dev.device_uid) * 2 + 1];
        format_hex(duid_str, sizeof(duid_str), dev.device_uid, sizeof(dev.device_uid));
        CHIAKI_LOGE(&global_log, "holepunch %s %s (%s) rp_enabled=%s\n",
                    dev.type == CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5 ? "PS5" : "PS4",
                    dev.device_name, duid_str, dev.remoteplay_enabled ? "true" : "false");
        (*env)->ReleaseStringUTFChars(env, nickName, nick_name);
        if (strcmp(dev.device_name, nick_name) == 0) {
            return (*env)->NewStringUTF(env, duid_str);
        }
    }

    return (*env)->NewStringUTF(env, "");
}

JNIEXPORT jstring JNICALL JNI_FCN(connectPsnConnection)(JNIEnv *env, jobject obj, jstring token, jboolean isPs5, jstring duid) {
    CHIAKI_LOGE(&global_log, "holepunch connectPsnConnection");

    const char *psn_oauth2_token = (*env)->GetStringUTFChars(env, token, NULL);
//    ChiakiHolepunchConsoleType console_type = isPs5 ? CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5 : CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS4;

    ChiakiHolepunchConsoleType console_type = CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5;
    ChiakiHolepunchDeviceInfo *device_info_ps5;
    size_t num_devices_ps5;

    ChiakiHolepunchSession session = chiaki_holepunch_session_init(psn_oauth2_token, &global_log);

    if (!session)
    {
        CHIAKI_LOGE(&global_log, ">> holepunch Found !! Failed to initialize session");
        return (*env)->NewStringUTF(env, "Failed");
    }
    CHIAKI_LOGE(&global_log, ">> holepunch Initialized session\n");

    ChiakiErrorCode err = chiaki_holepunch_list_devices(psn_oauth2_token, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5, &device_info_ps5, &num_devices_ps5, &global_log);
    if (err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "holepunch !! Failed to get PS5 devices");
        return (*env)->NewStringUTF(env, "Error: Failed to list devices");
    }
    CHIAKI_LOGE(&global_log, ">> holepunch Found %zu devices\n", num_devices_ps5);

    (*env)->ReleaseStringUTFChars(env, token, psn_oauth2_token);

    uint8_t device_uid[32];

    for (size_t i = 0; i < num_devices_ps5; i++)
    {
        ChiakiHolepunchDeviceInfo dev = device_info_ps5[i];
        char duid_str[sizeof(dev.device_uid) * 2 + 1];
        format_hex(duid_str, sizeof(duid_str), dev.device_uid, sizeof(dev.device_uid));
        CHIAKI_LOGE(&global_log, "holepunch %s %s (%s) rp_enabled=%s\n",
                    dev.type == CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5 ? "PS5" : "PS4",
                    dev.device_name, duid_str, dev.remoteplay_enabled ? "true" : "false");
    }

    memcpy(device_uid, device_info_ps5[0].device_uid, sizeof(device_uid));

    err = chiaki_holepunch_upnp_discover(session);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "holepunch !! Failed to run upnp discover");
        return (*env)->NewStringUTF(env, "Failed");
    }

    err = chiaki_holepunch_session_create(session);
    if (err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "holepunch !! Failed to create session\n");
        return (*env)->NewStringUTF(env, "Failed");
    }
    CHIAKI_LOGE(&global_log, ">> holepunch Created session success\n");

    err = holepunch_session_create_offer(session);
    if (err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "holepunch !! Failed to create offer msg for ctrl connection\n");
        return (*env)->NewStringUTF(env, "Failed");
    }
    CHIAKI_LOGE(&global_log, ">> holepunch Created offer msg for ctrl connection\n");

    // duid处理
    const char* duid_str = (*env)->GetStringUTFChars(env, duid, NULL);

    // FIXME: chiaki_holepunch_session_start: Timed out waiting for holepunch session start notifications.
    err = chiaki_holepunch_session_start(session, device_uid, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5);
    if (err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "holepunch !! Failed to start session\n");
        chiaki_holepunch_session_fini(session);
        return (*env)->NewStringUTF(env, "Failed");
    }
    CHIAKI_LOGE(&global_log, ">> holepunch Started session\n");

    err = chiaki_holepunch_session_punch_hole(session, CHIAKI_HOLEPUNCH_PORT_TYPE_CTRL);
    if (err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&global_log, "!! holepunch Failed to punch hole for control connection.");
        return (*env)->NewStringUTF(env, "Failed");
    }
    CHIAKI_LOGI(&global_log, ">> holepunch Punched hole for control connection!");

    (*env)->ReleaseStringUTFChars(env, token, psn_oauth2_token);

    CHIAKI_LOGI(&global_log, ">> holepunch Punched success!");

    return (*env)->NewStringUTF(env, "Success");
}

JNIEXPORT void JNICALL JNI_FCN(sessionCreate)(JNIEnv *env, jobject obj, jobject result, jobject connect_info_obj, jstring log_file_str, jboolean log_verbose, jobject java_session)
{
    AndroidChiakiSession *session = NULL;
    ChiakiLog *log = malloc(sizeof(ChiakiLog));
    const char *log_file = log_file_str ? E->GetStringUTFChars(env, log_file_str, NULL) : NULL;
    android_chiaki_file_log_init(log, log_verbose ? CHIAKI_LOG_ALL : (CHIAKI_LOG_ALL & ~CHIAKI_LOG_VERBOSE), log_file);
    if(log_file)
        E->ReleaseStringUTFChars(env, log_file_str, log_file);

    ChiakiErrorCode err = CHIAKI_ERR_SUCCESS;
    char *host_str = NULL;
    char *parsed_host_str = NULL;

    jclass result_class = E->GetObjectClass(env, result);

    jclass connect_info_class = E->GetObjectClass(env, connect_info_obj);
    jboolean ps5 = E->GetBooleanField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "ps5", "Z"));
    jstring host_string = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "host", "Ljava/lang/String;"));
    jstring parsed_host_string = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "parsedHost", "Ljava/lang/String;"));
    jbyteArray regist_key_array = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "registKey", "[B"));
    jbyteArray morning_array = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "morning", "[B"));
    jobject connect_video_profile_obj = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "videoProfile", "L"BASE_PACKAGE"/ConnectVideoProfile;"));
    jclass connect_video_profile_class = E->GetObjectClass(env, connect_video_profile_obj);
    jboolean enable_keyboard = E->GetBooleanField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "enableKeyboard", "Z"));
    jbyteArray psn_account_id = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "psnAccountId", "[B"));
    jstring access_token_string = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "accessToken", "Ljava/lang/String;"));
    jstring nick_name_string = E->GetObjectField(env, connect_info_obj, E->GetFieldID(env, connect_info_class, "nickName", "Ljava/lang/String;"));

    ChiakiConnectInfo connect_info = { 0 };
    connect_info.ps5 = ps5;
    connect_info.enable_dualsense = ps5; // Make haptic rumble
    connect_info.enable_keyboard = enable_keyboard; // Using device keyboard send text

    jboolean is_remote = JNI_TRUE;

    const char* host_cstr = (*env)->GetStringUTFChars(env, host_string, NULL);
    if (host_cstr != NULL) {
        if (strncmp(host_cstr, "192.168", 7) == 0) {
            is_remote = JNI_FALSE;
        }
        if (strncmp(host_cstr, "172.", 4) == 0) {
            is_remote = JNI_FALSE;
        }
        (*env)->ReleaseStringUTFChars(env, host_string, host_cstr);
    }

    const char *str_borrow = E->GetStringUTFChars(env, host_string, NULL);
    connect_info.host = host_str = strdup(str_borrow);
    E->ReleaseStringUTFChars(env, host_string, str_borrow);
    if(!connect_info.host)
    {
        err = CHIAKI_ERR_MEMORY;
        goto beach;
    }

    if(E->GetArrayLength(env, regist_key_array) != sizeof(connect_info.regist_key))
    {
        CHIAKI_LOGE(log, "Regist Key passed from Java has invalid length");
        err = CHIAKI_ERR_INVALID_DATA;
        goto beach;
    }
    jbyte *bytes = E->GetByteArrayElements(env, regist_key_array, NULL);
    memcpy(connect_info.regist_key, bytes, sizeof(connect_info.regist_key));
    E->ReleaseByteArrayElements(env, regist_key_array, bytes, JNI_ABORT);

    if(E->GetArrayLength(env, morning_array) != sizeof(connect_info.morning))
    {
        CHIAKI_LOGE(log, "Morning passed from Java has invalid length");
        err = CHIAKI_ERR_INVALID_DATA;
        goto beach;
    }
    bytes = E->GetByteArrayElements(env, morning_array, NULL);
    memcpy(connect_info.morning, bytes, sizeof(connect_info.morning));
    E->ReleaseByteArrayElements(env, morning_array, bytes, JNI_ABORT);

    connect_info.video_profile.width = (unsigned int)E->GetIntField(env, connect_video_profile_obj, E->GetFieldID(env, connect_video_profile_class, "width", "I"));
    connect_info.video_profile.height = (unsigned int)E->GetIntField(env, connect_video_profile_obj, E->GetFieldID(env, connect_video_profile_class, "height", "I"));
    connect_info.video_profile.max_fps = (unsigned int)E->GetIntField(env, connect_video_profile_obj, E->GetFieldID(env, connect_video_profile_class, "maxFPS", "I"));
    connect_info.video_profile.bitrate = (unsigned int)E->GetIntField(env, connect_video_profile_obj, E->GetFieldID(env, connect_video_profile_class, "bitrate", "I"));

    jobject codec_obj = E->GetObjectField(env, connect_video_profile_obj, E->GetFieldID(env, connect_video_profile_class, "codec", "L"BASE_PACKAGE"/Codec;"));
    jclass codec_class = E->GetObjectClass(env, codec_obj);
    jint target_value = E->GetIntField(env, codec_obj, E->GetFieldID(env, codec_class, "value", "I"));
    connect_info.video_profile.codec = (ChiakiCodec)target_value;

    connect_info.video_profile_auto_downgrade = true;

    session = CHIAKI_NEW(AndroidChiakiSession);
    if(!session)
    {
        err = CHIAKI_ERR_MEMORY;
        goto beach;
    }
    memset(session, 0, sizeof(AndroidChiakiSession));
    session->log = log;
    err = android_chiaki_video_decoder_init(&session->video_decoder, log, connect_info.video_profile.width, connect_info.video_profile.height,
                                            connect_info.ps5 ? connect_info.video_profile.codec : CHIAKI_CODEC_H264, is_remote);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        free(session);
        session = NULL;
        goto beach;
    }

    err = android_chiaki_audio_decoder_init(&session->audio_decoder, log);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        android_chiaki_video_decoder_fini(&session->video_decoder);
        free(session);
        session = NULL;
        goto beach;
    }

    session->audio_output = android_chiaki_audio_output_new(log);

    // Initial controller for dualsense controller sensor
    android_chiaki_controller_init(&session->controller);

    android_chiaki_audio_decoder_set_cb(&session->audio_decoder, android_chiaki_audio_output_settings, android_chiaki_audio_output_frame, session->audio_output);

    const char *parsed_str_borrow = E->GetStringUTFChars(env, parsed_host_string, NULL);
    const char *parsed_host = strdup(parsed_str_borrow);
    E->ReleaseStringUTFChars(env, parsed_host_string, parsed_str_borrow);

    char *ipv6 = strchr(parsed_host, ':');

    // holepunch_session初始化
    connect_info.holepunch_session = NULL;
    const char* nick_name_cstr = (*env)->GetStringUTFChars(env, nick_name_string, NULL);
    const char* access_token_cstr = (*env)->GetStringUTFChars(env, access_token_string, NULL);
    jint nick_name_length = (*env)->GetStringLength(env, nick_name_string);
    jint access_token_length = (*env)->GetStringLength(env, access_token_string);

    // 如果access_token不为空，则进入PSN自动远程连接模式
    if (nick_name_cstr != NULL && access_token_cstr != NULL && nick_name_length > 0 && access_token_length > 0) {
        ChiakiHolepunchSession hole_session = chiaki_holepunch_session_init(access_token_cstr, &global_log);
        connect_info.holepunch_session = hole_session;

        jbyte* test = (*env)->GetByteArrayElements(env, psn_account_id, NULL);

        memcpy(connect_info.psn_account_id, test, CHIAKI_PSN_ACCOUNT_ID_SIZE);

        CHIAKI_LOGE(log, "holepunch chiaki_session_init");
        err = chiaki_session_init(&session->session, &connect_info, log);
    } else {
        // 继续使用原来的session逻辑
        CHIAKI_LOGE(log, "holepunch chiaki_session_init_v6");
        err = chiaki_session_init_v6(&session->session, &connect_info, log);
    }


//    if (ipv6) {
//        CHIAKI_LOGE(log, "chiaki_session_init_v6 parsed_host : %s", parsed_host);
//        err = chiaki_session_init_v6(&session->session, &connect_info, log);
//    } else {
//        err = chiaki_session_init(&session->session, &connect_info, log);
//    }

    if(err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(log, "JNI ChiakiSession failed to init");
        android_chiaki_video_decoder_fini(&session->video_decoder);
        android_chiaki_audio_decoder_fini(&session->audio_decoder);
        android_chiaki_audio_output_free(session->audio_output);
        free(session);
        session = NULL;
        goto beach;
    }

    session->java_session = E->NewGlobalRef(env, java_session);
    session->java_session_class = E->NewGlobalRef(env, E->GetObjectClass(env, session->java_session));
    session->java_session_event_connected_meth = E->GetMethodID(env, session->java_session_class, "eventConnected", "()V");
    session->java_session_event_holepunch_meth = E->GetMethodID(env, session->java_session_class, "eventHolepunchFinish", "()V");
    session->java_session_event_login_pin_request_meth = E->GetMethodID(env, session->java_session_class, "eventLoginPinRequest", "(Z)V");
    session->java_session_event_quit_meth = E->GetMethodID(env, session->java_session_class, "eventQuit", "(ILjava/lang/String;)V");
    session->java_session_event_rumble_meth = E->GetMethodID(env, session->java_session_class, "eventRumble", "(II)V");
    session->java_session_event_rumble_tigger_meth = E->GetMethodID(env, session->java_session_class, "eventRumbleTigger", "(IIII)V");

    jclass controller_state_class = E->FindClass(env, BASE_PACKAGE"/ControllerState");
    session->java_controller_state_buttons = E->GetFieldID(env, controller_state_class, "buttons", "I");
    session->java_controller_state_l2_state = E->GetFieldID(env, controller_state_class, "l2State", "B");
    session->java_controller_state_r2_state = E->GetFieldID(env, controller_state_class, "r2State", "B");
    session->java_controller_state_left_x = E->GetFieldID(env, controller_state_class, "leftX", "S");
    session->java_controller_state_left_y = E->GetFieldID(env, controller_state_class, "leftY", "S");
    session->java_controller_state_right_x = E->GetFieldID(env, controller_state_class, "rightX", "S");
    session->java_controller_state_right_y = E->GetFieldID(env, controller_state_class, "rightY", "S");
    session->java_controller_state_touches = E->GetFieldID(env, controller_state_class, "touches", "[L"BASE_PACKAGE"/ControllerTouch;");
    session->java_controller_state_gyro_x = E->GetFieldID(env, controller_state_class, "gyroX", "F");
    session->java_controller_state_gyro_y = E->GetFieldID(env, controller_state_class, "gyroY", "F");
    session->java_controller_state_gyro_z = E->GetFieldID(env, controller_state_class, "gyroZ", "F");
    session->java_controller_state_accel_x = E->GetFieldID(env, controller_state_class, "accelX", "F");
    session->java_controller_state_accel_y = E->GetFieldID(env, controller_state_class, "accelY", "F");
    session->java_controller_state_accel_z = E->GetFieldID(env, controller_state_class, "accelZ", "F");
    session->java_controller_state_orient_x = E->GetFieldID(env, controller_state_class, "orientX", "F");
    session->java_controller_state_orient_y = E->GetFieldID(env, controller_state_class, "orientY", "F");
    session->java_controller_state_orient_z = E->GetFieldID(env, controller_state_class, "orientZ", "F");
    session->java_controller_state_orient_w = E->GetFieldID(env, controller_state_class, "orientW", "F");

    jclass controller_touch_class = E->FindClass(env, BASE_PACKAGE"/ControllerTouch");
    session->java_controller_touch_x = E->GetFieldID(env, controller_touch_class, "x", "S");
    session->java_controller_touch_y = E->GetFieldID(env, controller_touch_class, "y", "S");
    session->java_controller_touch_id = E->GetFieldID(env, controller_touch_class, "id", "B");

    // From lib/include/chiaki/session.h
    chiaki_session_set_event_cb(&session->session, android_chiaki_event_cb, session);
    chiaki_session_set_video_sample_cb(&session->session, android_chiaki_video_decoder_video_sample, &session->video_decoder);

    ChiakiAudioSink audio_sink;
    android_chiaki_audio_decoder_get_sink(&session->audio_decoder, &audio_sink);
    chiaki_session_set_audio_sink(&session->session, &audio_sink);

    ChiakiAudioSink audio_haptic_sink;
    android_chiaki_audio_haptics_decoder_get_sink(&session->session,&session->audio_decoder, &audio_haptic_sink);
    chiaki_session_set_haptics_sink(&session->session, &audio_haptic_sink);

    // PSN自动连接
    if (nick_name_cstr != NULL && access_token_cstr != NULL && nick_name_length > 0 && access_token_length > 0 && connect_info.holepunch_session != NULL) {

        ChiakiHolepunchConsoleType console_type = CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5;
        ChiakiHolepunchDeviceInfo *device_info_ps5;
        size_t num_devices_ps5;

        ChiakiErrorCode err = chiaki_holepunch_list_devices(access_token_cstr, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5, &device_info_ps5, &num_devices_ps5, &global_log);
        if (err != CHIAKI_ERR_SUCCESS)
        {
            CHIAKI_LOGE(&global_log, "holepunch !! Failed to get PS5 devices, try again");

            // Try again
            ChiakiErrorCode err2 = chiaki_holepunch_list_devices(access_token_cstr, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5, &device_info_ps5, &num_devices_ps5, &global_log);
            if (err2 != CHIAKI_ERR_SUCCESS)
            {
                CHIAKI_LOGE(&global_log, "holepunch !! Failed to get PS5 devices");

                // Try again
                ChiakiErrorCode err3 = chiaki_holepunch_list_devices(access_token_cstr, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5, &device_info_ps5, &num_devices_ps5, &global_log);
                if (err3 != CHIAKI_ERR_SUCCESS)
                {
                    CHIAKI_LOGE(&global_log, "holepunch !! Failed to get PS5 devices");
                    goto beach;
                }
            }
        }
        CHIAKI_LOGE(&global_log, ">> holepunch Found %zu devices\n", num_devices_ps5);

        uint8_t device_uid[32];
        bool device_found = false;

        for (size_t i = 0; i < num_devices_ps5; i++)
        {
            ChiakiHolepunchDeviceInfo dev = device_info_ps5[i];
            char duid_str[sizeof(dev.device_uid) * 2 + 1];
            format_hex(duid_str, sizeof(duid_str), dev.device_uid, sizeof(dev.device_uid));
            CHIAKI_LOGE(&global_log, "holepunch %s %s (%s) rp_enabled=%s\n",
                        dev.type == CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5 ? "PS5" : "PS4",
                        dev.device_name, duid_str, dev.remoteplay_enabled ? "true" : "false");
            if (strcmp(dev.device_name, nick_name_cstr) == 0) {
                memcpy(device_uid, dev.device_uid, sizeof(device_uid));
                device_found = true;
            }
        }

        if (!device_found) {
            CHIAKI_LOGE(&global_log, "holepunch !! Failed to find ps");
            goto beach;
        }

        err = chiaki_holepunch_upnp_discover(connect_info.holepunch_session);
        if(err != CHIAKI_ERR_SUCCESS)
        {
            CHIAKI_LOGE(&global_log, "holepunch !! Failed to run upnp discover");
            goto beach;
        }

        err = chiaki_holepunch_session_create(connect_info.holepunch_session);
        if (err != CHIAKI_ERR_SUCCESS)
        {
            CHIAKI_LOGE(&global_log, "holepunch !! Failed to create session\n");
            goto beach;
        }
        CHIAKI_LOGE(&global_log, ">> holepunch Created session success\n");

        err = holepunch_session_create_offer(connect_info.holepunch_session);
        if (err != CHIAKI_ERR_SUCCESS)
        {
            CHIAKI_LOGE(&global_log, "holepunch !! Failed to create offer msg for ctrl connection\n");
            goto beach;
        }
        CHIAKI_LOGE(&global_log, ">> holepunch Created offer msg for ctrl connection\n");


        err = chiaki_holepunch_session_start(connect_info.holepunch_session, device_uid, CHIAKI_HOLEPUNCH_CONSOLE_TYPE_PS5);
        if (err != CHIAKI_ERR_SUCCESS)
        {
            CHIAKI_LOGE(&global_log, "holepunch !! Failed to start session\n");
            chiaki_holepunch_session_fini(connect_info.holepunch_session);
            goto beach;
        }
        CHIAKI_LOGE(&global_log, ">> holepunch Started session\n");

        err = chiaki_holepunch_session_punch_hole(connect_info.holepunch_session, CHIAKI_HOLEPUNCH_PORT_TYPE_CTRL);
        if (err != CHIAKI_ERR_SUCCESS)
        {
            CHIAKI_LOGE(&global_log, "!! holepunch Failed to punch hole for control connection.");
            goto beach;
        }
        CHIAKI_LOGI(&global_log, ">> holepunch Punched hole for control connection!");

        CHIAKI_LOGI(&global_log, ">> holepunch Punched success!");
    }

    beach:
    if(!session && log)
    {
        android_chiaki_file_log_fini(log);
        free(log);
    }

    free(host_str);
    E->SetIntField(env, result, E->GetFieldID(env, result_class, "errorCode", "I"), (jint)err);
    E->SetLongField(env, result, E->GetFieldID(env, result_class, "ptr", "J"), (jlong)session);
}

JNIEXPORT void JNICALL JNI_FCN(sessionFree)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    if(!session)
        return;
    CHIAKI_LOGI(session->log, "Shutting down JNI Session");
    chiaki_session_fini(&session->session);
    android_chiaki_video_decoder_fini(&session->video_decoder);
    android_chiaki_audio_decoder_fini(&session->audio_decoder);
    android_chiaki_audio_output_free(session->audio_output);
    E->DeleteGlobalRef(env, session->java_session);
    E->DeleteGlobalRef(env, session->java_session_class);
    CHIAKI_LOGI(session->log, "JNI Session has quit");
    android_chiaki_file_log_fini(session->log);
    free(session->log);
    free(session);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionStart)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    CHIAKI_LOGI(session->log, "Start JNI Session");
    return chiaki_session_start(&session->session);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionStop)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    CHIAKI_LOGI(session->log, "Stop JNI Session");
    return chiaki_session_stop(&session->session);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionGotoBed)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    return chiaki_session_goto_bed(&session->session);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionKeyboardAccept)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    return chiaki_session_keyboard_accept(&session->session);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionSetText)(JNIEnv *env, jobject obj, jlong ptr, jstring text)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    const char *text_str = E->GetStringUTFChars(env, text, NULL);
    return chiaki_session_keyboard_set_text(&session->session, text_str);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionKeyboardReject)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    return chiaki_session_keyboard_reject(&session->session);
}

JNIEXPORT jint JNICALL JNI_FCN(sessionJoin)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    CHIAKI_LOGI(session->log, "Join JNI Session");
    return chiaki_session_join(&session->session);
}

JNIEXPORT void JNICALL JNI_FCN(sessionSetSurface)(JNIEnv *env, jobject obj, jlong ptr, jobject surface)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    android_chiaki_video_decoder_set_surface(&session->video_decoder, env, surface);
}

JNIEXPORT void JNICALL JNI_FCN(sessionSetControllerState)(JNIEnv *env, jobject obj, jlong ptr, jobject controller_state_java)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    ChiakiControllerState controller_state;
    chiaki_controller_state_set_idle(&controller_state);
    controller_state.buttons = (uint32_t)E->GetIntField(env, controller_state_java, session->java_controller_state_buttons);
    controller_state.l2_state = (uint8_t)E->GetByteField(env, controller_state_java, session->java_controller_state_l2_state);
    controller_state.r2_state = (uint8_t)E->GetByteField(env, controller_state_java, session->java_controller_state_r2_state);
    controller_state.left_x = (int16_t)E->GetShortField(env, controller_state_java, session->java_controller_state_left_x);
    controller_state.left_y = (int16_t)E->GetShortField(env, controller_state_java, session->java_controller_state_left_y);
    controller_state.right_x = (int16_t)E->GetShortField(env, controller_state_java, session->java_controller_state_right_x);
    controller_state.right_y = (int16_t)E->GetShortField(env, controller_state_java, session->java_controller_state_right_y);
    jobjectArray touch_array = E->GetObjectField(env, controller_state_java, session->java_controller_state_touches);
    size_t touch_array_len = (size_t)E->GetArrayLength(env, touch_array);
    for(size_t i = 0; i < CHIAKI_CONTROLLER_TOUCHES_MAX; i++)
    {
        if(i < touch_array_len)
        {
            jobject touch = E->GetObjectArrayElement(env, touch_array, i);
            controller_state.touches[i].x = (uint16_t)E->GetShortField(env, touch, session->java_controller_touch_x);
            controller_state.touches[i].y = (uint16_t)E->GetShortField(env, touch, session->java_controller_touch_y);
            controller_state.touches[i].id = (int8_t)E->GetByteField(env, touch, session->java_controller_touch_id);
        }
        else
        {
            controller_state.touches[i].x = 0;
            controller_state.touches[i].y = 0;
            controller_state.touches[i].id = -1;
        }
    }
    controller_state.gyro_x = E->GetFloatField(env, controller_state_java, session->java_controller_state_gyro_x);
    controller_state.gyro_y = E->GetFloatField(env, controller_state_java, session->java_controller_state_gyro_y);
    controller_state.gyro_z = E->GetFloatField(env, controller_state_java, session->java_controller_state_gyro_z);
    controller_state.accel_x = E->GetFloatField(env, controller_state_java, session->java_controller_state_accel_x);
    controller_state.accel_y = E->GetFloatField(env, controller_state_java, session->java_controller_state_accel_y);
    controller_state.accel_z = E->GetFloatField(env, controller_state_java, session->java_controller_state_accel_z);
    controller_state.orient_x = E->GetFloatField(env, controller_state_java, session->java_controller_state_orient_x);
    controller_state.orient_y = E->GetFloatField(env, controller_state_java, session->java_controller_state_orient_y);
    controller_state.orient_z = E->GetFloatField(env, controller_state_java, session->java_controller_state_orient_z);
    controller_state.orient_w = E->GetFloatField(env, controller_state_java, session->java_controller_state_orient_w);
    chiaki_session_set_controller_state(&session->session, &controller_state);
}

JNIEXPORT void JNICALL JNI_FCN(sessionSetSensorState)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
}

JNIEXPORT void JNICALL JNI_FCN(sessionSetLoginPin)(JNIEnv *env, jobject obj, jlong ptr, jstring pin_java)
{
    AndroidChiakiSession *session = (AndroidChiakiSession *)ptr;
    const char *pin = E->GetStringUTFChars(env, pin_java, NULL);
    chiaki_session_set_login_pin(&session->session, (const uint8_t *)pin, strlen(pin));
    E->ReleaseStringUTFChars(env, pin_java, pin);
}

static ChiakiErrorCode sockaddr_from_java(JNIEnv *env, jobject /*InetSocketAddress*/ sockaddr_obj, struct sockaddr **addr, size_t *addr_size)
{
    jclass sockaddr_class = E->GetObjectClass(env, sockaddr_obj);
    uint16_t port = (uint16_t)E->CallIntMethod(env, sockaddr_obj, E->GetMethodID(env, sockaddr_class, "getPort", "()I"));
    jobject addr_obj = E->CallObjectMethod(env, sockaddr_obj, E->GetMethodID(env, sockaddr_class, "getAddress", "()Ljava/net/InetAddress;"));
    jclass addr_class = E->GetObjectClass(env, addr_obj);
    jbyteArray addr_byte_array = E->CallObjectMethod(env, addr_obj, E->GetMethodID(env, addr_class, "getAddress", "()[B"));
    jsize addr_byte_array_len = E->GetArrayLength(env, addr_byte_array);

    if(addr_byte_array_len == 4)
    {
        struct sockaddr_in *inaddr = CHIAKI_NEW(struct sockaddr_in);
        if(!inaddr)
            return CHIAKI_ERR_MEMORY;
        memset(inaddr, 0, sizeof(*inaddr));
        inaddr->sin_family = AF_INET;
        jbyte *bytes = E->GetByteArrayElements(env, addr_byte_array, NULL);
        memcpy(&inaddr->sin_addr.s_addr, bytes, sizeof(inaddr->sin_addr.s_addr));
        E->ReleaseByteArrayElements(env, addr_byte_array, bytes, JNI_ABORT);
        inaddr->sin_port = htons(port);

        *addr = (struct sockaddr *)inaddr;
        *addr_size = sizeof(*inaddr);
    }
    else if(addr_byte_array_len == 0x10)
    {
        struct sockaddr_in6 *inaddr6 = CHIAKI_NEW(struct sockaddr_in6);
        if(!inaddr6)
            return CHIAKI_ERR_MEMORY;
        memset(inaddr6, 0, sizeof(*inaddr6));
        inaddr6->sin6_family = AF_INET6;
        jbyte *bytes = E->GetByteArrayElements(env, addr_byte_array, NULL);
        memcpy(&inaddr6->sin6_addr.in6_u, bytes, sizeof(inaddr6->sin6_addr.in6_u));
        E->ReleaseByteArrayElements(env, addr_byte_array, bytes, JNI_ABORT);
        inaddr6->sin6_port = htons(port);

        *addr = (struct sockaddr *)inaddr6;
        *addr_size = sizeof(*inaddr6);
    }
    else
        return CHIAKI_ERR_INVALID_DATA;

    return CHIAKI_ERR_SUCCESS;
}

typedef struct android_chiaki_regist_t
{
    AndroidChiakiJNILog log;
    ChiakiRegist regist;

    jobject java_regist;
    jmethodID java_regist_event_meth;

    jclass java_target_class;

    jobject java_regist_event_canceled;
    jobject java_regist_event_failed;
    jclass java_regist_event_success_class;
    jmethodID java_regist_event_success_ctor;

    jclass java_regist_host_class;
    jmethodID java_regist_host_ctor;
} AndroidChiakiRegist;

static jobject create_jni_target(JNIEnv *env, jclass target_class, ChiakiTarget target)
{
    jmethodID meth = E->GetStaticMethodID(env, target_class, "fromValue", "(I)L"BASE_PACKAGE"/Target;");
    return E->CallStaticObjectMethod(env, target_class, meth, (jint)target);
}

static void android_chiaki_regist_cb(ChiakiRegistEvent *event, void *user)
{
    AndroidChiakiRegist *regist = user;

    JNIEnv *env = attach_thread_jni();
    if(!env)
        return;

    jobject java_event = NULL;
    switch(event->type)
    {
        case CHIAKI_REGIST_EVENT_TYPE_FINISHED_CANCELED:
            java_event = regist->java_regist_event_canceled;
            break;
        case CHIAKI_REGIST_EVENT_TYPE_FINISHED_FAILED:
            java_event = regist->java_regist_event_failed;
            break;
        case CHIAKI_REGIST_EVENT_TYPE_FINISHED_SUCCESS:
        {
            ChiakiRegisteredHost *host = event->registered_host;
            jobject java_host = E->NewObject(env, regist->java_regist_host_class, regist->java_regist_host_ctor,
                                             create_jni_target(env, regist->java_target_class, host->target),
                                             jnistr_from_ascii(env, host->ap_ssid),
                                             jnistr_from_ascii(env, host->ap_bssid),
                                             jnistr_from_ascii(env, host->ap_key),
                                             jnistr_from_ascii(env, host->ap_name),
                                             jnibytearray_create(env, host->server_mac, sizeof(host->server_mac)),
                                             jnistr_from_ascii(env, host->server_nickname),
                                             jnibytearray_create(env, (const uint8_t *)host->rp_regist_key, sizeof(host->rp_regist_key)),
                                             (jint)host->rp_key_type,
                                             jnibytearray_create(env, host->rp_key, sizeof(host->rp_key)));
            java_event = E->NewObject(env, regist->java_regist_event_success_class, regist->java_regist_event_success_ctor, java_host);
            break;
        }
    }

    if(java_event)
        E->CallVoidMethod(env, regist->java_regist, regist->java_regist_event_meth, java_event);

    (*global_vm)->DetachCurrentThread(global_vm);
}

static void android_chiaki_regist_fini_partial(JNIEnv *env, AndroidChiakiRegist *regist)
{
    android_chiaki_jni_log_fini(&regist->log, env);
    E->DeleteGlobalRef(env, regist->java_regist);
    E->DeleteGlobalRef(env, regist->java_target_class);
    E->DeleteGlobalRef(env, regist->java_regist_event_canceled);
    E->DeleteGlobalRef(env, regist->java_regist_event_failed);
    E->DeleteGlobalRef(env, regist->java_regist_event_success_class);
    E->DeleteGlobalRef(env, regist->java_regist_host_class);
}

JNIEXPORT void JNICALL JNI_FCN(registStart)(JNIEnv *env, jobject obj, jobject result, jobject regist_info_obj, jobject log_obj, jobject java_regist)
{
    jclass result_class = E->GetObjectClass(env, result);
    ChiakiErrorCode err = CHIAKI_ERR_SUCCESS;
    AndroidChiakiRegist *regist = CHIAKI_NEW(AndroidChiakiRegist);
    if(!regist)
    {
        err = CHIAKI_ERR_MEMORY;
        goto beach;
    }

    android_chiaki_jni_log_init(&regist->log, env, log_obj);

    regist->java_regist = E->NewGlobalRef(env, java_regist);
    regist->java_regist_event_meth = E->GetMethodID(env, E->GetObjectClass(env, regist->java_regist), "event", "(L"BASE_PACKAGE"/RegistEvent;)V");

    regist->java_target_class = E->NewGlobalRef(env, E->FindClass(env, BASE_PACKAGE"/Target"));

    regist->java_regist_event_canceled = E->NewGlobalRef(env, get_kotlin_global_object(env, BASE_PACKAGE"/RegistEventCanceled"));
    regist->java_regist_event_failed = E->NewGlobalRef(env, get_kotlin_global_object(env, BASE_PACKAGE"/RegistEventFailed"));
    regist->java_regist_event_success_class = E->NewGlobalRef(env, E->FindClass(env, BASE_PACKAGE"/RegistEventSuccess"));
    regist->java_regist_event_success_ctor = E->GetMethodID(env, regist->java_regist_event_success_class, "<init>", "(L"BASE_PACKAGE"/RegistHost;)V");

    regist->java_regist_host_class = E->NewGlobalRef(env, E->FindClass(env, BASE_PACKAGE"/RegistHost"));
    regist->java_regist_host_ctor = E->GetMethodID(env, regist->java_regist_host_class, "<init>", "("
                                                                                                  "L"BASE_PACKAGE"/Target;" // target: Target
                                                                                                  "Ljava/lang/String;" // apSsid: String
                                                                                                  "Ljava/lang/String;" // apBssid: String
                                                                                                  "Ljava/lang/String;" // apKey: String
                                                                                                  "Ljava/lang/String;" // apName: String
                                                                                                  "[B" // serverMac: ByteArray
                                                                                                  "Ljava/lang/String;" // serverNickname: String
                                                                                                  "[B" // rpRegistKey: ByteArray
                                                                                                  "I" // rpKeyType: UInt
                                                                                                  "[B" // rpKey: ByteArray
                                                                                                  ")V");

    jclass regist_info_class = E->GetObjectClass(env, regist_info_obj);

    jobject target_obj = E->GetObjectField(env, regist_info_obj, E->GetFieldID(env, regist_info_class, "target", "L"BASE_PACKAGE"/Target;"));
    jclass target_class = E->GetObjectClass(env, target_obj);
    jint target_value = E->GetIntField(env, target_obj, E->GetFieldID(env, target_class, "value", "I"));

    jstring host_string = E->GetObjectField(env, regist_info_obj, E->GetFieldID(env, regist_info_class, "host", "Ljava/lang/String;"));
    jboolean broadcast = E->GetBooleanField(env, regist_info_obj, E->GetFieldID(env, regist_info_class, "broadcast", "Z"));
    jstring psn_online_id_string = E->GetObjectField(env, regist_info_obj, E->GetFieldID(env, regist_info_class, "psnOnlineId", "Ljava/lang/String;"));
    jbyteArray psn_account_id_array = E->GetObjectField(env, regist_info_obj, E->GetFieldID(env, regist_info_class, "psnAccountId", "[B"));
    jint pin = E->GetIntField(env, regist_info_obj, E->GetFieldID(env, regist_info_class, "pin", "I"));

    ChiakiRegistInfo regist_info = { 0 };
    regist_info.target = (ChiakiTarget)target_value;
    regist_info.host = E->GetStringUTFChars(env, host_string, NULL);
    regist_info.broadcast = broadcast;
    if(psn_online_id_string)
        regist_info.psn_online_id = E->GetStringUTFChars(env, psn_online_id_string, NULL);
    if(psn_account_id_array && E->GetArrayLength(env, psn_account_id_array) == sizeof(regist_info.psn_account_id))
        E->GetByteArrayRegion(env, psn_account_id_array, 0, sizeof(regist_info.psn_account_id), (jbyte *)regist_info.psn_account_id);
    regist_info.pin = (uint32_t)pin;

    err = chiaki_regist_start(&regist->regist, &regist->log.log, &regist_info, android_chiaki_regist_cb, regist);

    E->ReleaseStringUTFChars(env, host_string, regist_info.host);
    if(regist_info.psn_online_id)
        E->ReleaseStringUTFChars(env, psn_online_id_string, regist_info.psn_online_id);

    if(err != CHIAKI_ERR_SUCCESS)
    {
        android_chiaki_regist_fini_partial(env, regist);
        free(regist);
        regist = NULL;
    }

    beach:
    E->SetIntField(env, result, E->GetFieldID(env, result_class, "errorCode", "I"), (jint)err);
    E->SetLongField(env, result, E->GetFieldID(env, result_class, "ptr", "J"), (jlong)regist);
}

JNIEXPORT void JNICALL JNI_FCN(registStop)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiRegist *regist = (AndroidChiakiRegist *)ptr;
    chiaki_regist_stop(&regist->regist);
}

JNIEXPORT void JNICALL JNI_FCN(registFree)(JNIEnv *env, jobject obj, jlong ptr)
{
    AndroidChiakiRegist *regist = (AndroidChiakiRegist *)ptr;
    chiaki_regist_fini(&regist->regist);
    android_chiaki_regist_fini_partial(env, regist);
    free(regist);
}
