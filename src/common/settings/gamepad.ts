import i18next from '../../i18n';

const {t} = i18next;

const gamepad = [
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
    title: t('Override native gamepad support'),
    description: t('bind_usb_device_description'),
    tips: t('bind_usb_device_tips'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
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
];

export default gamepad;
