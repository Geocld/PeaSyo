import {storage} from './mmkv';
import {debugFactory} from '../utils/debug';
const log = debugFactory('settingStore');

const STORE_KEY = 'user.settings';

export type Settings = {
  locale: string;
  resolution: number;
  bitrate_mode: string;
  bitrate: number;
  codec: string;
  fps: number;
  useSurface: boolean;
  show_performance: boolean;
  performance_style: boolean;
  rumble: boolean;
  rumble_intensity: number;
  sensor: boolean;
  sensor_invert: boolean;
  gyroscope: number;
  gyroscope_type: number;
  gyroscope_sensitivity_x: number;
  gyroscope_sensitivity_y: number;
  gyroscope_invert: number;
  bind_usb_device: boolean;
  bind_usb_device_force_touchpad: boolean;
  dead_zone: number;
  edge_compensation: number;
  short_trigger: boolean;
  video_format: string;
  show_virtual_gamead: boolean;
  show_touchpad: boolean;
  touchpad_type: number; // 0 - default, 1 - full
  virtual_gamepad_opacity: number;
  custom_virtual_gamepad: string;
  gamepad_maping: Record<string, number>;
  show_menu: boolean;
  check_update: boolean;
  swap_dpad: boolean;
  theme: string;
  rgb: string;
  keyboard: boolean;
  auto_remote: boolean;
  debug: boolean;
};

const defaultSettings: Settings = {
  locale: 'en',
  resolution: 720,
  bitrate_mode: 'auto',
  bitrate: 10000,
  codec: 'H265',
  fps: 30,
  useSurface: true,
  show_performance: false,
  performance_style: true,
  rumble: true,
  rumble_intensity: 3,
  sensor: false,
  sensor_invert: false,
  gyroscope: 0,
  gyroscope_type: 1,
  gyroscope_sensitivity_x: 15000,
  gyroscope_sensitivity_y: 15000,
  gyroscope_invert: 0,
  bind_usb_device: false,
  bind_usb_device_force_touchpad: false,
  dead_zone: 0.2,
  edge_compensation: 0,
  short_trigger: false,
  video_format: '',
  show_virtual_gamead: false,
  show_touchpad: true,
  touchpad_type: 0,
  virtual_gamepad_opacity: 0.6,
  custom_virtual_gamepad: '',
  gamepad_maping: {},
  show_menu: false,
  check_update: true,
  swap_dpad: false,
  theme: 'dark',
  rgb: '#DF6069',
  keyboard: false,
  auto_remote: false,
  debug: false,
};

export const saveSettings = (settings: Settings) => {
  log.info('SaveSettings:', settings);
  const totalSettings = Object.assign({}, defaultSettings, settings);
  storage.set(STORE_KEY, JSON.stringify(totalSettings));
};

export const getSettings = (): Settings => {
  let settings = storage.getString(STORE_KEY);
  if (!settings) {
    return defaultSettings;
  }
  try {
    const _settings = JSON.parse(settings) as Settings;
    return Object.assign({}, defaultSettings, _settings);
  } catch {
    return defaultSettings;
  }
};

export const resetSettings = () => {
  storage.set(STORE_KEY, JSON.stringify(defaultSettings));
};
