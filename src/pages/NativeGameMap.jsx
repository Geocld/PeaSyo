import React from 'react';
import {View, StyleSheet, FlatList, ToastAndroid} from 'react-native';
import {Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {getSettings, saveSettings} from '../store/settingStore';
import {debugFactory} from '../utils/debug';
import MapItem from '../components/MapItem';
import {GAMEPAD_MAPING} from '../common';

const log = debugFactory('NativeGameMapScreen');

const defaultMaping = GAMEPAD_MAPING;

const buttonLabels = [
  'A',
  'B',
  'X',
  'Y',
  'DPadUp',
  'DPadDown',
  'DPadLeft',
  'DPadRight',
  'LeftShoulder',
  'RightShoulder',
  'LeftTrigger',
  'RightTrigger',
  'LeftThumb',
  'RightThumb',
  'View',
  'Menu',
  'Nexus',
  'Touchpad',
];

function NativeGameMap({navigation, route}) {
  const {t} = useTranslation();

  const [maping, setMaping] = React.useState(
    JSON.parse(JSON.stringify(defaultMaping)),
  );

  const [settings, setSettings] = React.useState(null);

  const mapingRef = React.useRef(maping);

  React.useEffect(() => {
    log.info('Native Gamemap screen show');
    if (settings === null) {
      const _settings = getSettings();
      log.info('Get localSettings:', JSON.stringify(_settings));
      setSettings(_settings);
      if (
        _settings.gamepad_maping &&
        Object.keys(_settings.gamepad_maping).length > 0
      ) {
        setMaping(_settings.gamepad_maping);
        mapingRef.current = _settings.gamepad_maping;
      }
    }
    if (route.params?.button && route.params?.keyCode !== undefined) {
      const button = route.params.button;
      const keyCode = route.params.keyCode;
      // console.log('setMaping:', button, keyCode);
      // console.log('mapingRef.current:', mapingRef.current);
      // If keyCode is conflicted, set other's keycode to 0
      for (const k in mapingRef.current) {
        if (mapingRef.current[k] === keyCode) {
          mapingRef.current[k] = 0;
        }
      }
      setMaping({
        ...mapingRef.current,
        [button]: keyCode,
      });
      mapingRef.current = {
        ...mapingRef.current,
        [button]: keyCode,
      };
    }
  }, [navigation, settings, route.params?.button, route.params?.keyCode]);

  const renderDatas = [];
  buttonLabels.forEach(button => {
    const defaultButtons = [
      'DPadUp',
      'DPadDown',
      'DPadLeft',
      'DPadRight',
      'LeftThumb',
      'RightThumb',
      'Nexus',
      'Touchpad',
    ];
    const largeButtons = ['View', 'Menu'];
    if (defaultButtons.indexOf(button) > -1) {
      renderDatas.push({
        name: button,
        value: maping[button],
      });
    } else if (largeButtons.indexOf(button) > -1) {
      renderDatas.push({
        name: button,
        value: maping[button],
        width: 60,
        height: 60,
      });
    } else {
      renderDatas.push({
        name: button,
        value: maping[button],
        width: 40,
        height: 40,
      });
    }
  });

  const handleItemPress = item => {
    navigation.navigate('GameMapDetail', {
      button: item.name,
    });
  };

  const handleSave = () => {
    // console.log('maping:', maping);
    settings.gamepad_maping = maping;
    setSettings(settings);
    saveSettings(settings);
    ToastAndroid.show(t('Saved'), ToastAndroid.SHORT);
    navigation.goBack();
  };

  const handleReset = () => {
    setMaping(JSON.parse(JSON.stringify(defaultMaping)));
    mapingRef.current = JSON.parse(JSON.stringify(defaultMaping));
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.scrollView}
        data={renderDatas}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        renderItem={({item}) => {
          return (
            <View style={styles.listItem}>
              <MapItem mapItem={item} onPress={handleItemPress} />
            </View>
          );
        }}
      />

      <View style={styles.buttonWrap}>
        <Button mode="contained" style={styles.button} onPress={handleSave}>
          {t('Save')}
        </Button>
        <Button mode="outlined" style={styles.button} onPress={handleReset}>
          {t('Reset')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  scrollView: {
    marginBottom: 150,
  },
  listItem: {
    width: '50%',
    justifyContent: 'center',
  },
  buttonWrap: {
    position: 'absolute',
    left: 0,
    width: '100%',
    bottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  button: {
    marginTop: 10,
  },
});

export default NativeGameMap;
