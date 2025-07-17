import i18next from '../../i18n';

const {t} = i18next;

const display = [
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
    min: 0,
    max: 1,
    step: 0.1,
    title: t('Virtual Opacity'),
    description: t('Config opacity of virtual gamepad'),
    data: [],
  },
  {
    name: 'virtual_gamepad_joystick',
    type: 'radio',
    title: t('virtual_joystick_title'),
    description: t('virtual_joystick_desc'),
    tips: t('virtual_joystick_tips'),
    data: [
      {value: 0, text: t('Fixed')},
      {value: 1, text: t('Free')},
    ],
  },
  {
    name: 'show_menu',
    type: 'radio',
    title: t('show_menu_title'),
    description: t('show_menu_desc'),
    data: [
      {value: false, text: t('Disable')},
      {value: true, text: t('Enable')},
    ],
  },
];

export default display;
