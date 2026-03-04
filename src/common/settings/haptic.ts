import i18next from '../../i18n';

const {t} = i18next;

const haptic = [
  {
    name: 'haptic_feedback_intensity',
    type: 'radio',
    title: t('Haptic feedback intensity'),
    description: t('HapticFeedbackIntensityDesc'),
    data: [
      {value: 0.5, text: t('HapticStandard')},
      {value: 0.15, text: t('Weak')},
      {value: 0.75, text: t('Strong')},
    ],
  },
];

export default haptic;
