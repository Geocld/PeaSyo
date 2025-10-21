package com.peasyo;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;

import java.util.HashMap;
import java.util.Map;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import android.util.Log;

public class HapticModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private UsbManager usbManager;
    private UsbDevice currentDevice;
    private UsbDeviceConnection connection;
    private UsbInterface usbInterface;
    private UsbEndpoint endpointOut;

    private UsbEndpoint[] audioEndpoints; // 存储所有音频端点

    // DualSense音频通道配置
    private static final int NUM_CHANNELS = 4;
    private static final int CHANNEL_3 = 2; // 数组索引从0开始，通道3对应索引2
    private static final int CHANNEL_4 = 3; // 通道4对应索引3

    public HapticModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.usbManager = (UsbManager) reactContext.getSystemService(Context.USB_SERVICE);
    }
    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "HapticModule";
    }

    private String getDeviceClass(int deviceClass) {
        switch (deviceClass) {
            case UsbConstants.USB_CLASS_AUDIO:
                return "AUDIO";
            case UsbConstants.USB_CLASS_COMM:
                return "COMM";
            case UsbConstants.USB_CLASS_HID:
                return "HID";
            default:
                return "CLASS_" + deviceClass;
        }
    }

    private String getInterfaceClass(int interfaceClass) {
        switch (interfaceClass) {
            case UsbConstants.USB_CLASS_AUDIO: return "AUDIO";
            case UsbConstants.USB_CLASS_HID: return "HID";
            case UsbConstants.USB_CLASS_COMM: return "COMM";
            case UsbConstants.USB_CLASS_MASS_STORAGE: return "MASS_STORAGE";
            default: return "INTERFACE_" + interfaceClass;
        }
    }

    private String getDirectionName(int direction) {
        return direction == UsbConstants.USB_DIR_OUT ? "OUT" : "IN";
    }

    private String getEndpointType(int type) {
        switch (type) {
            case UsbConstants.USB_ENDPOINT_XFER_BULK: return "BULK";
            case UsbConstants.USB_ENDPOINT_XFER_INT: return "INTERRUPT";
            case UsbConstants.USB_ENDPOINT_XFER_ISOC: return "ISOCHRONOUS";
            default: return "TYPE_" + type;
        }
    }

    // 生成正弦波音频数据
    private byte[] generateSineWave(int numSamples, int sampleRate, double frequency) {
        byte[] audioData = new byte[numSamples * 2]; // 16位音频

        for (int i = 0; i < numSamples; i++) {
            double sample = Math.sin(2.0 * Math.PI * i * frequency / sampleRate);
            short pcmSample = (short) (sample * 32767);

            // 小端字节序
            audioData[i * 2] = (byte) (pcmSample & 0xFF);
            audioData[i * 2 + 1] = (byte) ((pcmSample >> 8) & 0xFF);
        }

        return audioData;
    }

    @ReactMethod
    public void sendAudioSignal() {
        Log.d("HapticModule", "sendAudioSignal");
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        WritableArray devices = new WritableNativeArray();

        for (UsbDevice device : deviceList.values()) {
            WritableMap deviceMap = new WritableNativeMap();
            deviceMap.putString("deviceName", device.getDeviceName());
            deviceMap.putInt("vendorId", device.getVendorId());
            deviceMap.putInt("productId", device.getProductId());
            deviceMap.putString("deviceClass", getDeviceClass(device.getDeviceClass()));

            // 添加接口信息
            WritableArray interfaces = new WritableNativeArray();
            for (int i = 0; i < device.getInterfaceCount(); i++) {
                UsbInterface intf = device.getInterface(i);
                WritableMap intfMap = new WritableNativeMap();
                intfMap.putInt("interfaceId", i);
                intfMap.putInt("interfaceClass", intf.getInterfaceClass());
                intfMap.putString("interfaceClassName", getInterfaceClass(intf.getInterfaceClass()));

                // 添加端点信息
                WritableArray endpoints = new WritableNativeArray();
                for (int j = 0; j < intf.getEndpointCount(); j++) {
                    UsbEndpoint endpoint = intf.getEndpoint(j);
                    WritableMap endpointMap = new WritableNativeMap();
                    endpointMap.putInt("endpointNumber", endpoint.getEndpointNumber());
                    endpointMap.putInt("direction", endpoint.getDirection());
                    endpointMap.putString("directionName", getDirectionName(endpoint.getDirection()));
                    endpointMap.putInt("type", endpoint.getType());
                    endpointMap.putString("typeName", getEndpointType(endpoint.getType()));
                    endpoints.pushMap(endpointMap);
                }
                intfMap.putArray("endpoints", endpoints);
                interfaces.pushMap(intfMap);
            }
            deviceMap.putArray("interfaces", interfaces);
            devices.pushMap(deviceMap);

            // 查找音频接口
            boolean interfaceFound = false;
            for (int i = 0; i < device.getInterfaceCount(); i++) {
                UsbInterface intf = device.getInterface(i);

                if (intf.getInterfaceClass() == UsbConstants.USB_CLASS_AUDIO) {
                    usbInterface = intf;
                }

                // 查找所有音频输出端点
                int endpointCount = 0;
                for (int j = 0; j < usbInterface.getEndpointCount(); j++) {
                    UsbEndpoint endpoint = usbInterface.getEndpoint(j);
                    if (endpoint.getDirection() == UsbConstants.USB_DIR_OUT) {
                        if (audioEndpoints == null) {
                            audioEndpoints = new UsbEndpoint[4]; // 假设最多4个通道
                        }
                        if (endpointCount < audioEndpoints.length) {
                            audioEndpoints[endpointCount] = endpoint;
                            Log.d("HapticModule", "找到音频输出端点: " + endpoint.getEndpointNumber());
                        }
                        endpointCount++;
                    }
                }

                Log.d("HapticModule", "找到 " + endpointCount + " 个音频输出端点");
                interfaceFound = true;
            }

            if (!interfaceFound) {
                Log.d("HapticModule", "未找到音频接口");
                return;
            }

            // 向所有音频通道发送模拟信号
            int sampleRate = 48000;
            int numSamples = (sampleRate * 1000) / 1000;

            connection = usbManager.openDevice(device);

            // 生成音频数据
            byte[] audioData = generateSineWave(numSamples, sampleRate, 440);

            Log.d("HapticModule", "audioEndpoints:" + audioEndpoints.length);
            // 向所有找到的音频端点发送数据
            for (int i = 0; i < audioEndpoints.length; i++) {
                if (audioEndpoints[i] != null) {
                    int transferred = connection.bulkTransfer(
                            audioEndpoints[i],
                            audioData,
                            audioData.length,
                            5000
                    );

                    if (transferred > 0) {
                        Log.d("HapticModule", "通道 " + (i + 1) + " 发送成功: " + transferred + " 字节");
                    } else {
                        Log.d("HapticModule", "transferred error");
                    }
                }
            }
        }

        Log.d("HapticModule", "devices:" + devices);
    }
}