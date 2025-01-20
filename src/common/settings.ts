import i18next from '../i18n';

const {t} = i18next;

const settings = [
  {
    name: 'locale',
    type: 'radio',
    title: t('App language'),
    description: t('Set language of Peasyo'),
    data: [
      {value: 'en', text: 'English'},
      {value: 'zh', text: '简体中文'},
      {value: 'zht', text: '繁體中文'},
    ],
  },
  {
    name: 'theme',
    type: 'radio',
    title: t('Theme'),
    description: t('Set the app theme to take effect on the next launch'),
    data: [
      {value: 'auto', text: t('Auto')},
      {value: 'light', text: t('Light')},
      {value: 'dark', text: t('Dark')},
    ],
  },
  {
    name: 'resolution',
    type: 'radio',
    title: t('Resolution'),
    description: t('ResolutionDesc'),
    data: [
      {value: 360, text: '360P'},
      {value: 540, text: '540P'},
      {value: 720, text: '720P'},
      {value: 1080, text: '1080P'},
    ],
  },
  {
    name: 'video_format',
    type: 'radio',
    title: t('Video stream format'),
    description: t('VideoFormatDesc'),
    data: [
      {value: '', text: t('Aspect ratio')},
      {value: 'Stretch', text: t('Stretch')},
      {value: 'Zoom', text: t('Zoom')},
      {value: '16:10', text: '16:10'},
      {value: '18:9', text: '18:9'},
      {value: '21:9', text: '21:9'},
      {value: '4:3', text: '4:3'},
    ],
  },
  {
    name: 'bitrate_mode',
    type: 'radio',
    title: t('Stream bitrate'),
    description: t('BitrateDesc'),
    data: [
      {value: 'auto', text: t('Auto')},
      {value: 'custom', text: t('Custom')},
    ],
  },
  {
    name: 'codec',
    type: 'radio',
    title: t('Codec'),
    description: t('CodecDesc'),
    data: [
      {value: 'H264', text: 'H264'},
      {value: 'H265', text: 'H265'},
      {value: 'H265-HDR', text: 'H265-HDR'},
    ],
  },
  {
    name: 'fps',
    type: 'radio',
    title: t('FPS'),
    description: t('FPSDesc'),
    data: [
      {value: 30, text: t('30')},
      {value: 60, text: t('60')},
    ],
  },
  {
    name: 'useSurface',
    type: 'radio',
    title: t('Performance render'),
    description: t('PerformanceRenderDesc'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'rumble',
    type: 'radio',
    title: t('Rumble'),
    description: t('RumbleDesc'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'rumble_intensity',
    type: 'radio',
    title: t('Rumble intensity'),
    description: t('RumbleIntensityDesc'),
    data: [
      {value: 1, text: t('VeryWeak')},
      {value: 2, text: t('Weak')},
      {value: 3, text: t('Normal')},
      {value: 4, text: t('Strong')},
      {value: 5, text: t('VeryStrong')},
    ],
  },
  {
    name: 'bind_usb_device',
    type: 'radio',
    title: t('Override native Xbox gamepad support'),
    description: t('bind_usb_device_description'),
    tips: t('bind_usb_device_tips'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'touchpad_type',
    type: 'radio',
    title: t('Touchpad type'),
    description: t('TouchpadTypeDesc'),
    tips: t('TouchpadTypeTips'),
    data: [
      {value: 0, text: t('Default')},
      {value: 1, text: t('Fullscreen')},
    ],
  },
  {
    name: 'sensor',
    type: 'radio',
    title: t('Sensor'),
    description: t('SensorDesc'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'sensor_invert',
    type: 'radio',
    title: t('Invert Sensor'),
    description: t('InvertSensorDesc'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'show_performance',
    type: 'radio',
    title: t('Show performance'),
    description: t('Always display the performance panel'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'performance_style',
    type: 'radio',
    title: t('Performance show style'),
    description: t('Setting performance show style'),
    data: [
      {value: true, text: t('Horizon')},
      {value: false, text: t('Vertical')},
    ],
  },
  {
    name: 'maping',
    type: '',
    title: t('Key mapping'),
    description: t('Mapping key of gamepad'),
    data: [],
  },
  {
    name: 'dead_zone',
    type: 'slider',
    min: 0.1,
    max: 0.9,
    step: 0.01,
    title: t('Joystick dead zone'),
    description: t('DeadZoneDesc'),
    data: [],
  },
  {
    name: 'edge_compensation',
    type: 'slider',
    min: 0,
    max: 20,
    step: 1,
    title: t('Joystick edge compensation'),
    description: t('EdgeDesc'),
    data: [],
  },
  {
    name: 'short_trigger',
    type: 'radio',
    title: t('Short Trigger'),
    description: t('Modify the linear trigger action to a short trigger'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'show_virtual_gamead',
    type: 'radio',
    title: t('Virtual gamepad'),
    description: t('Always display the virtual gamepad'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'show_touchpad',
    type: 'radio',
    title: t('Touchpad'),
    description: t('Always display touchpad'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'virtual_gamepad_opacity',
    type: 'slider',
    min: 0.1,
    max: 1,
    step: 0.1,
    title: t('Virtual Opacity'),
    description: t('Config opacity of virtual gamepad'),
    data: [],
  },
  {
    name: 'check_update',
    type: 'radio',
    title: t('Auto check update'),
    description: t('AutoUpdateDesc'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
];

export default settings;
