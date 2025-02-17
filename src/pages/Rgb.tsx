import React from 'react';
import {StyleSheet, View, ScrollView, ToastAndroid} from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';

import {Button, Text} from 'react-native-paper';
import {useTranslation} from 'react-i18next';

import {getSettings, saveSettings} from '../store/settingStore';

function RgbScreen({navigation}) {
  const {t} = useTranslation();
  const [settings, setSettings] = React.useState<any>({});
  const [currentColor, setCurrentColor] = React.useState('#DF6069');
  const colorPickerRef = React.useRef<any>(null);

  React.useEffect(() => {
    const _settings = getSettings();
    setSettings(_settings);

    console.log('_settings:', _settings);
    if (_settings.rgb) {
      setCurrentColor(_settings.rgb);
    }
  }, [navigation]);

  const handleColorChangeComplete = color => {
    setCurrentColor(color);
  };

  const handleSave = () => {
    settings.rgb = currentColor;
    saveSettings(settings);
    ToastAndroid.show(t('Saved'), ToastAndroid.SHORT);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* <View style={styles.tips}>
          <Text>{currentColor}</Text>
        </View> */}
        <View>
          <ColorPicker
            ref={colorPickerRef}
            color={currentColor}
            swatchesOnly={false}
            onColorChangeComplete={handleColorChangeComplete}
            thumbSize={20}
            sliderSize={20}
            noSnap={true}
            row={false}
            swatchesLast={false}
            swatches={false}
            discrete={false}
            useNativeDriver={false}
            useNativeLayout={false}
          />
        </View>
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

export default RgbScreen;
