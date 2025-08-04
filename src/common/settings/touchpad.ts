import i18next from '../../i18n';

const {t} = i18next;

const touchpad = [
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
    name: 'touchpad_type',
    type: 'radio',
    title: t('Touchpad type'),
    description: t('TouchpadTypeDesc'),
    tips: t('TouchpadTypeTips'),
    data: [
      {value: 0, text: t('Default')},
      {value: 1, text: t('Fullscreen')},
      {value: 2, text: t('Dual')},
    ],
  },
  {
    name: 'touchpad_scale',
    type: 'slider',
    min: 0.5,
    max: 3,
    step: 0.1,
    title: t('TouchpadScaleTitle'),
    description: t('TouchpadScaleDesc'),
    data: [],
  },
  {
    name: 'touchpad_offset_mode',
    type: 'radio',
    title: t('TouchpadOffsetTitle'),
    description: t('TouchpadOffsetDesc'),
    tips: t('TouchpadOffsetTips'),
    data: [
      {value: 'auto', text: t('Auto')},
      {value: 'custom', text: t('Custom')},
    ],
  },
];

export default touchpad;
