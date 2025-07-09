import i18next from '../../i18n';

const {t} = i18next;

const sensor = [
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
    name: 'gyroscope',
    type: 'radio',
    title: t('gyroTitle'),
    description: t('gyroDesc'),
    tips: t('gyroTips'),
    data: [
      {value: 0, text: t('Disable')},
      {value: 1, text: t('Device')},
      {value: 2, text: t('Controller(DS5)')},
    ],
  },
  {
    name: 'gyroscope_type',
    type: 'radio',
    title: t('gyroTypeTitle'),
    description: t('gyroTypeDesc'),
    data: [
      {value: 1, text: t('L2 press')},
      {value: 2, text: t('L1 press')},
      {value: 3, text: t('Global')},
    ],
  },
  {
    name: 'gyroscope_sensitivity_x',
    type: 'slider',
    min: 100,
    max: 30000,
    step: 100,
    title: t('gyroSenTitleX'),
    description: t('gyroSenDescX'),
    data: [],
  },
  {
    name: 'gyroscope_sensitivity_y',
    type: 'slider',
    min: 100,
    max: 30000,
    step: 100,
    title: t('gyroSenTitleY'),
    description: t('gyroSenDescY'),
    data: [],
  },
  {
    name: 'gyroscope_invert',
    type: 'radio',
    title: t('gyroSenInvertTitle'),
    description: t('gyroSenInvertDesc'),
    data: [
      {value: 0, text: t('Disable')},
      {value: 1, text: t('x_axies')},
      {value: 2, text: t('y_axies')},
      {value: 3, text: t('all_axies')},
    ],
  },
  {
    name: 'xy_invert',
    type: 'radio',
    title: t('xyInvertTitle'),
    description: t('xyInvertDesc'),
    data: [
      {value: false, text: t('Disable')},
      {value: true, text: t('Enable')},
    ],
  },
];

export default sensor;
