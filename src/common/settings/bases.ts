import i18next from '../../i18n';

const {t} = i18next;

const bases = [
  {
    name: 'locale',
    type: 'radio',
    title: t('App language'),
    description: t('Set language of Peasyo'),
    data: [
      {value: 'en', text: 'English'},
      {value: 'es', text: 'Spanish'},
      {value: 'zh', text: '简体中文'},
      {value: 'zht', text: '繁體中文'},
    ],
  },
  {
    name: 'theme',
    type: 'radio',
    title: t('Theme'),
    description: t('Set the app theme to take effect on the next launch'),
    data: [
      {value: 'auto', text: t('Auto')},
      {value: 'light', text: t('Light')},
      {value: 'dark', text: t('Dark')},
    ],
  },
];

export default bases;
