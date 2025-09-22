import i18next from '../../i18n';

const {t} = i18next;

const display = [
  {
    name: 'video_format',
    type: 'radio',
    title: t('Video stream format'),
    description: t('VideoFormatDesc'),
    data: [
      {value: '', text: t('Aspect ratio')},
      {value: 'Stretch', text: t('Stretch')},
      {value: 'Zoom', text: t('Zoom')},
      {value: '16:10', text: '16:10'},
      {value: '18:9', text: '18:9'},
      {value: '21:9', text: '21:9'},
      {value: '4:3', text: '4:3'},
    ],
  },
  {
    name: 'useSurface',
    type: 'radio',
    title: t('Performance render'),
    description: t('PerformanceRenderDesc'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'show_performance',
    type: 'radio',
    title: t('Show performance'),
    description: t('Always display the performance panel'),
    data: [
      {value: true, text: t('Enable')},
      {value: false, text: t('Disable')},
    ],
  },
  {
    name: 'performance_style',
    type: 'radio',
    title: t('Performance show style'),
    description: t('Setting performance show style'),
    data: [
      {value: true, text: t('Horizon')},
      {value: false, text: t('Vertical')},
    ],
  },
  {
    name: 'show_menu',
    type: 'radio',
    title: t('show_menu_title'),
    description: t('show_menu_desc'),
    data: [
      {value: false, text: t('Disable')},
      {value: true, text: t('Enable')},
    ],
  },
];

export default display;
