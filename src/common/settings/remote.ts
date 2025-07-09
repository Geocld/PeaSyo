import i18next from '../../i18n';

const {t} = i18next;

const remote = [
  {
    name: 'remote_resolution',
    type: 'radio',
    title: t('RemoteResolution'),
    description: t('RemoteResolutionDesc'),
    data: [
      {value: 360, text: '360P'},
      {value: 540, text: '540P'},
      {value: 720, text: '720P'},
      {value: 1080, text: '1080P'},
    ],
  },
  {
    name: 'remote_bitrate_mode',
    type: 'radio',
    title: t('Remote stream bitrate'),
    description: t('RemoteBitrateDesc'),
    tips: t('BitrateTips'),
    data: [
      {value: 'auto', text: t('Auto')},
      {value: 'custom', text: t('Custom')},
    ],
  },
  {
    name: 'remote_codec',
    type: 'radio',
    title: t('RemoteCodec'),
    description: t('RemoteCodecDesc'),
    data: [
      {value: 'H264', text: 'H264'},
      {value: 'H265', text: 'H265'},
      {value: 'H265-HDR', text: 'H265-HDR'},
    ],
  },
  {
    name: 'remote_fps',
    type: 'radio',
    title: t('RemoteFPS'),
    description: t('RemoteFPSDesc'),
    data: [
      {value: 30, text: t('30')},
      {value: 60, text: t('60')},
    ],
  },
];

export default remote;
