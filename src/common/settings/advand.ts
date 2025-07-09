import i18next from '../../i18n';

const {t} = i18next;

const advand = [
  {
    name: 'haptic_stable_threshold',
    type: 'slider',
    min: 0,
    max: 20,
    step: 1,
    title: t('Haptic_stable_threshold_title'),
    description: t('Haptic_stable_threshold_desc'),
    data: [],
  },
  {
    name: 'haptic_change_threshold',
    type: 'slider',
    min: 0,
    max: 30,
    step: 1,
    title: t('Haptic_change_threshold_title'),
    description: t('Haptic_change_threshold_desc'),
    data: [],
  },
  {
    name: 'haptic_diff_threshold',
    type: 'slider',
    min: 0,
    max: 50,
    step: 1,
    title: t('Haptic_diff_threshold_title'),
    description: t('Haptic_diff_threshold_desc'),
    data: [],
  },
];

export default advand;
