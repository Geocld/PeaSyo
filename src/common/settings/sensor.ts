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
    name: 'gyroscope_sensitivity',
    type: 'slider',
    min: 100,
    max: 30000,
    step: 100,
    title: t('gyroSenTitle'),
    description: t('gyroSenDesc'),
    data: [],
  },
];

export default sensor;
