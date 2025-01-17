package com.peasyo.log;

import android.content.Context;

import java.io.File;
import java.io.FilenameFilter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LogManager {
    private static final String BASE_DIR_NAME = "session_logs";
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss-SSS", Locale.US);
    private static final String FILE_PREFIX = "peasyo_session_";
    private static final String FILE_POSTFIX = ".log";
    private static final Pattern FILE_REGEX = Pattern.compile(FILE_PREFIX + "(.+)" + FILE_POSTFIX);
    private static final int KEEP_LOG_FILES_COUNT = 5;

    private final File baseDir;

    public LogManager(Context context) {
        baseDir = new File(context.getFilesDir(), BASE_DIR_NAME);
        baseDir.mkdirs();
    }

    public File getBaseDir() {
        return baseDir;
    }

    public List<LogFile> getFiles() {
        String[] fileList = baseDir.list((dir, name) -> FILE_REGEX.matcher(name).matches());
        List<LogFile> result = new ArrayList<>();

        if (fileList != null) {
            for (String filename : fileList) {
                LogFile logFile = LogFile.fromFilename(this, filename);
                if (logFile != null) {
                    result.add(logFile);
                }
            }
        }

        result.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return result;
    }

    public LogFile createNewFile() {
        List<LogFile> currentFiles = getFiles();
        if (currentFiles.size() > KEEP_LOG_FILES_COUNT) {
            for (int i = KEEP_LOG_FILES_COUNT; i < currentFiles.size(); i++) {
                currentFiles.get(i).getFile().delete();
            }
        }

        Date date = new Date();
        String filename = FILE_PREFIX + DATE_FORMAT.format(date) + FILE_POSTFIX;
        return LogFile.fromFilename(this, filename);
    }

    public static class LogFile {
        private final LogManager logManager;
        private final String filename;
        private final Date date;

        private LogFile(LogManager logManager, String filename, Date date) {
            this.logManager = logManager;
            this.filename = filename;
            this.date = date;
        }

        public static LogFile fromFilename(LogManager logManager, String filename) {
            try {
                Matcher matcher = FILE_REGEX.matcher(filename);
                if (matcher.matches()) {
                    String dateStr = matcher.group(1);
                    Date date = DATE_FORMAT.parse(dateStr);
                    if (date != null) {
                        return new LogFile(logManager, filename, date);
                    }
                }
            } catch (Exception e) {
                return null;
            }
            return null;
        }

        public LogManager getLogManager() {
            return logManager;
        }

        public String getFilename() {
            return filename;
        }

        public Date getDate() {
            return date;
        }

        public File getFile() {
            return new File(logManager.getBaseDir(), filename);
        }
    }
}
