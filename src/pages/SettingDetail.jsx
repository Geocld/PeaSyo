import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  NativeModules,
  ToastAndroid,
} from 'react-native';
import {Button, RadioButton, Text, Divider} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import RNRestart from 'react-native-restart';
import Slider from '@react-native-community/slider';
import {getSettings, saveSettings} from '../store/settingStore';
import settingsMeta from '../common/settings';

const {UsbRumbleManager} = NativeModules;

function SettingDetailScreen({navigation, route}) {
  const {t} = useTranslation();

  const [current, setCurrent] = React.useState('');
  const [value, setValue] = React.useState('');
  const [value2, setValue2] = React.useState('');
  const [currentMetas, setCurrentMetas] = React.useState(null);
  const [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    const _settings = getSettings();
    setSettings(_settings);

    if (route.params?.id) {
      const name = route.params.id;
      let currentVal = _settings[name];
      let metas = {};
      settingsMeta.forEach(item => {
        if (item.name === name) {
          metas = item;
        }
      });

      if (name === 'bitrate_mode') {
        setValue2(_settings.bitrate);
      }

      setValue(currentVal);
      setCurrent(name);
      setCurrentMetas(metas);
      navigation.setOptions({
        title: metas.title || '',
      });
    }
  }, [navigation, route.params?.id]);

  const handleSaveSettings = () => {
    if (settings[current] !== undefined) {
      settings[current] = value;
      setSettings(settings);
      saveSettings(settings);
    }
  };

  const handleSave = () => {
    if (current === 'locale') {
      handleSaveSettings();
      restart();
    } else if (current === 'resolution') {
      // Will reset bitrate when resolution change
      settings.bitrate_mode = 'auto';
      switch (value) {
        case 360:
          settings.bitrate = 2000;
          break;
        case 540:
          settings.bitrate = 6000;
          break;
        case 720:
          settings.bitrate = 10000;
          break;
        case 1080:
          settings.bitrate = 27000;
          break;
        default:
          break;
      }
    } else if (current === 'bitrate_mode') {
      settings.bitrate_mode = value;
      settings.bitrate = value2;
    } else if (currentMetas.name === 'bind_usb_device') {
      UsbRumbleManager.setBindUsbDevice(value);
    }
    handleSaveSettings();
    ToastAndroid.show(t('Saved'), ToastAndroid.SHORT);
    navigation.goBack();
  };

  const restart = () => {
    setTimeout(() => {
      RNRestart.restart();
    }, 500);
  };

  const renderOptions = () => {
    if (!currentMetas) {
      return null;
    }
    if (currentMetas.name === 'bitrate_mode') {
      return (
        <>
          <RadioButton.Group onValueChange={val => setValue(val)} value={value}>
            {currentMetas &&
              currentMetas.data.map((item, idx) => {
                return (
                  <RadioButton.Item
                    key={idx}
                    label={item.text}
                    value={item.value}
                  />
                );
              })}
          </RadioButton.Group>
          {value === 'custom' && (
            <>
              <Text style={styles.sliderTitle}>
                {t('Current')}: {value2} Kbps
              </Text>
              <Slider
                style={styles.slider}
                value={value2}
                minimumValue={2000}
                maximumValue={99999}
                step={100}
                lowerLimit={2000}
                onValueChange={val => {
                  setValue2(val);
                }}
                minimumTrackTintColor="#DF6069"
                maximumTrackTintColor="grey"
              />
            </>
          )}
        </>
      );
    }
    if (currentMetas.type === 'radio') {
      return (
        <RadioButton.Group onValueChange={val => setValue(val)} value={value}>
          {currentMetas &&
            currentMetas.data.map((item, idx) => {
              return (
                <RadioButton.Item
                  key={idx}
                  label={item.text}
                  value={item.value}
                />
              );
            })}
        </RadioButton.Group>
      );
    } else if (currentMetas.type === 'slider') {
      return (
        <>
          <Text style={styles.sliderTitle}>
            {t('Current')}: {value}
          </Text>
          <Slider
            style={styles.slider}
            value={value}
            minimumValue={currentMetas.min}
            maximumValue={currentMetas.max}
            step={currentMetas.step}
            onValueChange={val => {
              setValue(parseFloat(val.toFixed(2)));
            }}
            lowerLimit={0.1}
            minimumTrackTintColor="#DF6069"
            maximumTrackTintColor="grey"
          />
        </>
      );
    } else {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.tips}>
          <Text>{currentMetas && currentMetas.description}</Text>
        </View>

        {currentMetas && currentMetas.tips && (
          <View style={styles.tips}>
            <Text>Tips: {currentMetas && currentMetas.tips}</Text>
          </View>
        )}

        <Divider />

        {renderOptions()}
      </ScrollView>

      <View style={styles.buttonWrap}>
        <Button mode="contained" style={styles.button} onPress={handleSave}>
          {t('Save')}
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={() => navigation.goBack()}>
          {t('Back')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tips: {
    padding: 10,
  },
  scrollView: {
    marginBottom: 120,
  },
  sliderTitle: {
    padding: 10,
  },
  slider: {
    width: '100%',
    height: 40,
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

export default SettingDetailScreen;
