export {};

declare global {
  interface Window {
    ReactNativeWebView: any;
    __streamSettings: any;
    resolution: string
  }
}