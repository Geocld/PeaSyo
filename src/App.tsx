import React from 'react';
import {Alert, Linking, useColorScheme, NativeModules} from 'react-native';
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';

import {createStackNavigator} from '@react-navigation/stack';
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

import merge from 'deepmerge';
import {Provider} from 'react-redux';
import store from './store';
import {getSettings} from './store/settingStore';

import customLightTheme from './theme/index';
import customDarkTheme from './theme/index.dark';

import HomeScreen from './pages/Home';
import OptionsScreen from './pages/Options';
import LoginScreen from './pages/Login';
import LoginUsernameScreen from './pages/LoginUsername';
import RegistryScreen from './pages/Registry';
import ConsolesScreen from './pages/Consoles';
import ConsoleEditScreen from './pages/ConsoleEdit';
import SettingsScreen from './pages/Settings';
import SettingDetailScreen from './pages/SettingDetail';
import StreamScreen from './pages/Stream';
import TransferScreen from './pages/Transfer';
import DebugScreen from './pages/Debug';
import NativeGameMapScreen from './pages/NativeGameMap';
import GameMapDetailScreen from './pages/GameMapDetail';
import AboutScreen from './pages/About';
import FeedbackScreen from './pages/Feedback';
import DualSenseScreen from './pages/DualSense';
import DualSenseWebScreen from './pages/DualSenseWeb';
import VirtualGamepadSettingsScreen from './pages/VirtualGamepadSettings';
import CustomGamepadScreen from './pages/CustomGamepad';
import UsersScreen from './pages/Users';
import RgbScreen from './pages/Rgb';
import DeviceInfosScreen from './pages/DeviceInfos';
import ThanksScreen from './pages/Thanks';
import LogsScreen from './pages/Logs';
import updater from './utils/updater';

import {useTranslation} from 'react-i18next';
import {A11yProvider} from 'react-native-a11y';

import {SystemBars} from 'react-native-edge-to-edge';

import './i18n';

const RootStack = createStackNavigator();

const {UsbRumbleManager} = NativeModules;

const {LightTheme, DarkTheme} = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const paperLightTheme = {
  ...MD3LightTheme,
  colors: customLightTheme.colors,
};

const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: customDarkTheme.colors,
};

const CombinedDefaultTheme = merge(paperLightTheme, LightTheme);
const CombinedDarkTheme = merge(paperDarkTheme, DarkTheme);

function App() {
  const {t} = useTranslation();
  const colorScheme = useColorScheme();
  const settings = getSettings();

  if (settings.check_update) {
    updater().then((infos: any) => {
      if (infos) {
        const {latestVer, version, updateText, url} = infos;
        Alert.alert(
          t('Update Warning'),
          t(
            `Check new version ${latestVer}, current version: ${version}. \n\n ${updateText}`,
          ),
          [
            {
              text: t('Cancel'),
              style: 'default',
              onPress: () => {},
            },
            {
              text: t('Download'),
              style: 'default',
              onPress: () => {
                Linking.openURL(url).catch(_ => {});
              },
            },
          ],
        );
      }
    });
  }

  // console.log('bind_usb_device:', settings.bind_usb_device);
  if (settings.bind_usb_device !== undefined) {
    UsbRumbleManager.setBindUsbDevice(settings.bind_usb_device);
  }

  let paperTheme = paperDarkTheme;
  let navigationTheme = CombinedDarkTheme;

  if (settings.theme === 'auto') {
    paperTheme = colorScheme === 'dark' ? paperDarkTheme : paperLightTheme;
    navigationTheme =
      colorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme;
  } else if (settings.theme === 'light') {
    paperTheme = paperLightTheme;
    navigationTheme = CombinedDefaultTheme;
  }

  return (
    <>
      <Provider store={store}>
        <A11yProvider>
          <PaperProvider theme={paperTheme}>
            <NavigationContainer theme={navigationTheme}>
              <RootStack.Navigator>
                <RootStack.Group>
                  <RootStack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{title: t('Consoles')}}
                  />
                  <RootStack.Screen
                    name="Options"
                    component={OptionsScreen}
                    options={{title: t('Options')}}
                  />
                  <RootStack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{title: t('Login')}}
                  />
                  <RootStack.Screen
                    name="LoginUsername"
                    component={LoginUsernameScreen}
                    options={{title: t('Login')}}
                  />
                  <RootStack.Screen
                    name="Stream"
                    component={StreamScreen}
                    options={{headerShown: false}}
                  />
                  <RootStack.Screen
                    name="Registry"
                    component={RegistryScreen}
                    options={{title: t('Registry')}}
                  />
                  <RootStack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{title: t('Settings')}}
                  />
                  <RootStack.Screen
                    name="Consoles"
                    component={ConsolesScreen}
                    options={{title: t('Consoles')}}
                  />
                  <RootStack.Screen
                    name="ConsoleEdit"
                    component={ConsoleEditScreen}
                    options={{title: t('ConsoleEdit')}}
                  />
                  <RootStack.Screen
                    name="Transfer"
                    component={TransferScreen}
                    options={{title: t('Transfer')}}
                  />
                  <RootStack.Screen
                    name="DualSense"
                    component={DualSenseScreen}
                    options={{title: t('DualSense')}}
                  />
                  <RootStack.Screen
                    name="DualSenseWeb"
                    component={DualSenseWebScreen}
                    options={{title: t('DualSense')}}
                  />
                  <RootStack.Screen name="Debug" component={DebugScreen} />
                  <RootStack.Screen
                    name="CustomGamepad"
                    component={CustomGamepadScreen}
                    options={{headerShown: false}}
                  />
                  <RootStack.Screen
                    name="VirtualGamepadSettings"
                    component={VirtualGamepadSettingsScreen}
                    options={{title: t('Custom')}}
                  />
                  <RootStack.Screen
                    name="About"
                    component={AboutScreen}
                    options={{title: t('About')}}
                  />
                  <RootStack.Screen
                    name="Feedback"
                    component={FeedbackScreen}
                    options={{title: t('Chat')}}
                  />
                  <RootStack.Screen
                    name="SettingDetail"
                    component={SettingDetailScreen}
                  />
                  <RootStack.Screen
                    name="NativeGameMap"
                    component={NativeGameMapScreen}
                    options={{title: t('GameMap')}}
                  />
                  <RootStack.Screen
                    name="RGB"
                    component={RgbScreen}
                    options={{title: t('RGB')}}
                  />
                  <RootStack.Screen
                    name="DeviceInfos"
                    component={DeviceInfosScreen}
                    options={{title: t('Device testing')}}
                  />
                  <RootStack.Screen
                    name="Users"
                    component={UsersScreen}
                    options={{title: t('Users')}}
                  />
                  <RootStack.Screen
                    name="Thanks"
                    component={ThanksScreen}
                    options={{title: t('Thanks')}}
                  />
                  <RootStack.Screen
                    name="Logs"
                    component={LogsScreen}
                    options={{title: t('Logs')}}
                  />
                </RootStack.Group>

                <RootStack.Group screenOptions={{presentation: 'modal'}}>
                  <RootStack.Screen
                    name="GameMapDetail"
                    component={GameMapDetailScreen}
                    options={{title: t('GameMap')}}
                  />
                </RootStack.Group>
              </RootStack.Navigator>
            </NavigationContainer>
          </PaperProvider>
        </A11yProvider>
      </Provider>
      <SystemBars style="light" hidden={false} />
    </>
  );
}

export default App;
