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
];

export default sensor;
