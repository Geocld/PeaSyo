import i18next from '../../i18n';

const {t} = i18next;

const audio = [
  {
    name: 'audio_output_mode',
    type: 'radio',
    title: t('Audio mode'),
    description: t('AudioModeDesc'),
    data: [
      // {value: 'AUTO', text: t('Auto')}, // 暂时隐藏 AUTO 选项，因为会导致蓝牙耳机无声音输出
      {value: 'STANDARD', text: t('System default')},
      {value: 'SPEAKER', text: t('Speaker')},
      {value: 'WIRED', text: t('Wired headset')},
      {value: 'BLUETOOTH', text: t('Bluetooth headset')},
      {value: 'USB', text: t('USB audio')},
      {value: 'HDMI', text: t('HDMI audio')},
    ],
  },
  {
    name: 'audio_sharing_mode',
    type: 'radio',
    title: t('Audio sharing mode'),
    description: t('AudioSharingModeDesc'),
    data: [
      {value: 'SHARED', text: t('Shared (Recommended)')},
      {value: 'EXCLUSIVE', text: t('Exclusive (Low latency)')},
    ],
  },
];

export default audio;
