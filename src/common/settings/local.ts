import i18next from '../../i18n';

const {t} = i18next;

const local = [
  {
    name: 'resolution',
    type: 'radio',
    title: t('Resolution'),
    description: t('ResolutionDesc'),
    data: [
      {value: 360, text: '360P'},
      {value: 540, text: '540P'},
      {value: 720, text: '720P'},
      {value: 1080, text: '1080P'},
    ],
  },
  {
    name: 'bitrate_mode',
    type: 'radio',
    title: t('Stream bitrate'),
    description: t('BitrateDesc'),
    tips: t('BitrateTips'),
    data: [
      {value: 'auto', text: t('Auto')},
      {value: 'custom', text: t('Custom')},
    ],
  },
  {
    name: 'codec',
    type: 'radio',
    title: t('Codec'),
    description: t('CodecDesc'),
    data: [
      {value: 'H264', text: 'H264'},
      {value: 'H265', text: 'H265'},
      {value: 'H265-HDR', text: 'H265-HDR'},
    ],
  },
  {
    name: 'fps',
    type: 'radio',
    title: t('FPS'),
    description: t('FPSDesc'),
    data: [
      {value: 30, text: t('30')},
      {value: 60, text: t('60')},
    ],
  },
];

export default local;
