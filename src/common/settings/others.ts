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
];

export default others;
