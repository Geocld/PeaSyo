import React from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Vibration,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {Portal, Dialog, Switch} from 'react-native-paper';
import {getSettings, saveSettings} from '../store/settingStore';
import SettingItem from '../components/SettingItem';

const {GamepadManager, UsbRumbleManager} = NativeModules;

function DebugScreen({navigation, route}) {
  let authentication = useSelector(state => state.authentication);
  const [showDebug, setShowDebug] = React.useState(false);
  const [debug, setDebug] = React.useState(false);
  const [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    const _settings = getSettings();
    setSettings(_settings);

    console.log('_settings:', _settings);

    setDebug(_settings.debug);

    const eventEmitter = new NativeEventEmitter();

    // eventEmitter.addListener('onDeviceConnect', event => {
    //   Alert.alert('onDeviceConnect', JSON.stringify(event));
    // });

    navigation.addListener('beforeRemove', e => {
      console.log('beforeRemove:', e.data.action.type);
      // e.preventDefault();
    });
  }, [navigation]);

  return (
    <ScrollView>
      <SettingItem
        title={'device vibrate'}
        description={'Test device vibration'}
        onPress={() => {
          Vibration.vibrate(1000);
        }}
      />

      <SettingItem
        title={'Vibration(Native)'}
        description={'Test gamepad vibration'}
        onPress={() => {
          // handleRumble(int duration, short lowFreqMotor, short highFreqMotor, short leftTrigger, short rightTrigger, int intensity)
          // GamepadManager.vibrate(60000, 100, 100, 100, 1000);
          GamepadManager.vibrate(60000, 255, 185, 0, 0, 3);

          setTimeout(() => {
            GamepadManager.vibrate(0, 0, 0, 0, 0, 3);
          }, 500);

          // setTimeout(() => {
          //   GamepadManager.vibrate(0, 0, 0, 0, 0);
          // }, 1000);
        }}
      />

      <SettingItem
        title={'Vibration(xInput)'}
        description={'Test gamepad vibration with x-input mode'}
        onPress={() => {
          UsbRumbleManager.rumble(32767, 32767);

          // setTimeout(() => {
          //   UsbRumbleManager.rumble(0, 0);
          // }, 500);
        }}
      />

      <SettingItem
        title={'Trigger Rumble(xbox one controller)'}
        description={'Test gamepad trigger rumble with x-input mode'}
        onPress={() => {
          UsbRumbleManager.rumbleTriggers(32767, 32767);

          setTimeout(() => {
            UsbRumbleManager.rumbleTriggers(0, 0);
          }, 1000);
        }}
      />

      <SettingItem
        title={'DS5'}
        description={'Test Dualsense controller'}
        onPress={() => {
          UsbRumbleManager.sendCommand();
        }}
      />
    </ScrollView>
  );
}

export default DebugScreen;
