package com.peasyo.session

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.peasyo.MainActivity
import com.peasyo.R

/**
 * 外接显示器输出前台服务
 *
 * 职责：保持进程前台存活（挂起/切后台时串流画面与声音持续输出到外屏），
 * 并提供常驻通知（含"伪息屏"快速切换按钮）。
 * 画面呈现本体由 ExternalDisplayController 的 Presentation 完成（app context，不依赖 Activity）。
 */
class ExternalDisplayService : Service() {

    companion object {
        const val TAG = "ExternalDisplay"
        const val CHANNEL_ID = "peasyo_external_display"
        const val NOTIFICATION_ID = 0x0ED1
        const val ACTION_TOGGLE_PSEUDO_SCREEN_OFF = "com.peasyo.TOGGLE_PSEUDO_SCREEN_OFF"

        /** 启动前台服务（幂等） */
        @JvmStatic
        fun start(context: Context) {
            try {
                val intent = Intent(context, ExternalDisplayService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.w(TAG, "start service failed: ${e.message}")
            }
        }

        /** 停止前台服务（幂等） */
        @JvmStatic
        fun stop(context: Context) {
            try {
                context.stopService(Intent(context, ExternalDisplayService::class.java))
            } catch (e: Exception) {
                Log.w(TAG, "stop service failed: ${e.message}")
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        // 进程被杀后系统重启（START_STICKY）但串流会话已不存在：
        // 避免残留无输出的僵尸通知
        if (StreamSession.activeSession == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.ext_display_channel_name),
                    NotificationManager.IMPORTANCE_LOW,
                )
            )
        }

        // 伪息屏快速切换按钮：拉起 MainActivity（singleTask -> onNewIntent）-> 转发 JS 事件
        val toggleIntent = Intent(this, MainActivity::class.java).apply {
            action = ACTION_TOGGLE_PSEUDO_SCREEN_OFF
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val togglePendingIntent = PendingIntent.getActivity(
            this,
            1,
            toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        // 点击通知正文回到串流页
        val contentIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            2,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return builder
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.ext_display_notif_text))
            .setStyle(
                Notification.BigTextStyle().bigText(getString(R.string.ext_display_notif_text))
            )
            .setContentIntent(contentPendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .addAction(
                Notification.Action.Builder(
                    Icon.createWithResource(this, R.drawable.ic_pseudo_screen_off),
                    getString(R.string.ext_display_pseudo_action),
                    togglePendingIntent,
                ).build()
            )
            .build()
    }
}
