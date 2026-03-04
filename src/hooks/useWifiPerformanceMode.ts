import { useEffect } from 'react';
import { NativeModules } from 'react-native';

const { WifiPerformanceModule } = NativeModules;

/**
 * WiFi 性能模式 Hook
 * 在组件挂载时启用，卸载时禁用
 */
export const useWifiPerformanceMode = () => {
  useEffect(() => {
    // 组件挂载时启用 WiFi 性能模式
    if (WifiPerformanceModule) {
      WifiPerformanceModule.enableWifiPerformanceMode()
        .then(() => {
          console.log('WiFi performance mode enabled');
        })
        .catch((error: any) => {
          console.error('Failed to enable WiFi performance mode:', error);
        });
    }

    // 组件卸载时禁用 WiFi 性能模式
    return () => {
      if (WifiPerformanceModule) {
        WifiPerformanceModule.disableWifiPerformanceMode()
          .then(() => {
            console.log('WiFi performance mode disabled');
          })
          .catch((error: any) => {
            console.error('Failed to disable WiFi performance mode:', error);
          });
      }
    };
  }, []);
};
