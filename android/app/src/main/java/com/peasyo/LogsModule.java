package com.peasyo;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.List;

public class LogsModule extends ReactContextBaseJavaModule {

    ReactApplicationContext reactContext;
    private static final String BASE_DIR_NAME = "session_logs";
    private static final String FILE_PREFIX = "peasyo_session_";
    private static final String FILE_POSTFIX = ".log";
    private static final Pattern FILE_REGEX = Pattern.compile(FILE_PREFIX + "(.+)" + FILE_POSTFIX);
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss-SSS", Locale.US);

    private final File baseDir;

    public LogsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.baseDir = new File(reactContext.getFilesDir(), BASE_DIR_NAME);
    }

    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "LogsModule";
    }

    @ReactMethod
    public void getLogFiles(Promise promise) {
        try {
            File[] files = baseDir.listFiles((dir, name) -> FILE_REGEX.matcher(name).matches());
            WritableArray fileList = Arguments.createArray();

            if (files != null) {
                for (File file : files) {
                    try {
                        String filename = file.getName();
                        Matcher matcher = FILE_REGEX.matcher(filename);
                        if (matcher.matches()) {
                            String dateStr = matcher.group(1);
                            Date date = DATE_FORMAT.parse(dateStr);

                            WritableMap fileInfo = Arguments.createMap(); // 使用 WritableMap 替代 HashMap
                            fileInfo.putString("filename", filename);
                            fileInfo.putString("date", date != null ? date.toString() : "Unknown");
                            fileInfo.putString("path", file.getAbsolutePath());
                            fileList.pushMap(fileInfo); // 将 map 添加到 array
                        }
                    } catch (Exception e) {
                        // 跳过格式不匹配的文件
                    }
                }
            }

            ArrayList<ReadableMap> tempList = new ArrayList<>();
            for (int i = 0; i < fileList.size(); i++) {
                tempList.add(fileList.getMap(i));
            }

            tempList.sort((a, b) -> {
                String pathA = a.getString("path");
                String pathB = b.getString("path");
                return Long.compare(new File(pathB).lastModified(), new File(pathA).lastModified());
            });

            WritableArray sortedArray = Arguments.createArray();
            for (ReadableMap item : tempList) {
                sortedArray.pushMap(item);
            }

            promise.resolve(sortedArray);
        } catch (Exception e) {
            promise.reject("GET_LOG_FILES_ERROR", e);
        }
    }

    @ReactMethod
    public void shareLogFile(String filename, Promise promise) {
        try {
            File file = new File(baseDir, filename);
            Context context = getReactApplicationContext();

            // 检查文件是否存在（关键安全步骤）
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "Log file not found: " + file.getAbsolutePath());
                return;
            }

            // 获取 FileProvider URI（需确保 fileProviderAuthority 与 Manifest 一致）
            String fileProviderAuthority = context.getPackageName() + ".provider";
            Uri fileUri = FileProvider.getUriForFile(context, fileProviderAuthority, file);

            // 构建分享 Intent（与 Kotlin 代码逻辑对齐）
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            shareIntent.setClipData(ClipData.newRawUri("", fileUri)); // 关键修复：显式设置 ClipData

            // 授予临时权限给所有能接收的应用（增强兼容性）
            List<ResolveInfo> resInfoList = context.getPackageManager()
                    .queryIntentActivities(shareIntent, PackageManager.MATCH_DEFAULT_ONLY);
            for (ResolveInfo resolveInfo : resInfoList) {
                context.grantUriPermission(
                        resolveInfo.activityInfo.packageName,
                        fileUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                );
            }

            // 启动分享选择器（强制新建任务栈）
            Intent chooserIntent = Intent.createChooser(
                    shareIntent,
                    "Share Log File" // 可替换为 RN 传递的标题
            );
            chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooserIntent);

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SHARE_ERROR", "Failed to share file: " + e.getMessage(), e);
        }
    }
}
