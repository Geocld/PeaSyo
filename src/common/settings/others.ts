import i18next from '../../i18n';

const {t} = i18next;

const others = [
  // {
  //   name: 'keyboard',
  //   type: 'radio',
  //   title: t('Remote keyboard input'),
  //   description: t('Enable remote keyboard input'),
  //   data: [
  //     {value: false, text: t('Disable')},
  //     {value: true, text: t('Enable')},
  //   ],
  // },
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
  {
    name: 'auto_remote',
    type: 'radio',
    title: t('RemotePlayTitle'),
    description: t('RemotePlayDesc'),
    tips: t('RemotePlayTips'),
    data: [
      {value: false, text: t('Disable')},
      {value: true, text: t('Enable')},
    ],
  },
  {
    name: 'log_verbose',
    type: 'radio',
    title: t('LogVerboseTitle'),
    description: t('LogVerboseDesc'),
    data: [
      {value: false, text: t('Disable')},
      {value: true, text: t('Enable')},
    ],
  },
];

export default others;
