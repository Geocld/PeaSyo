import React, {useState} from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  View,
  NativeModules,
  ToastAndroid,
} from 'react-native';
import {Text} from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import {getSettings, resetSettings} from '../store/settingStore';
import SettingItem from '../components/SettingItem';
import RNRestart from 'react-native-restart';
import CookieManager from '@react-native-cookies/cookies';
import {useTranslation} from 'react-i18next';
import {debugFactory} from '../utils/debug';
import settingsMeta from '../common/settings';
import {TokenStore} from '../store/tokenStore';
import pkg from '../../package.json';

const {UsbRumbleManager} = NativeModules;

const log = debugFactory('SettingsScreen');

function SettingsScreen({navigation}) {
  const {t, i18n} = useTranslation();
  const [token, setToken] = useState(null);

  const currentLanguage = i18n.language;
  console.log('currentLanguage:', currentLanguage);

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    log.info('settings page show');
    const ts = new TokenStore();
    ts.load();
    const _token = ts.getToken();
    log.info('token:', _token);
    setToken(_token);
  }, [navigation]);

  const handleItemPress = async id => {
    if (id === 'logout') {
      Alert.alert(t('Warning'), t('LogoutText'), [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Confirm'),
          style: 'default',
          onPress: () => {
            setLoading(true);
            // Only clean user token
            const ts = new TokenStore();
            ts.clear();
            CookieManager.clearAll();
            setTimeout(() => {
              RNRestart.restart();
            }, 1000);
          },
        },
      ]);
    } else if (id === 'reset') {
      Alert.alert(t('Warning'), t('ResetText'), [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Confirm'),
          style: 'default',
          onPress: () => {
            resetSettings();
            ToastAndroid.show('设置重置成功', ToastAndroid.LONG);
          },
        },
      ]);
    } else if (id === 'maping') {
      const settings = getSettings();
      const hasValidUsbDevice = await UsbRumbleManager.getHasValidUsbDevice();
      const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;
      if (isUsbMode) {
        Alert.alert(t('UsbMappingDisable'));
        return;
      }
      navigation.navigate('NativeGameMap');
    } else if (id === 'debug') {
      navigation.navigate('Debug');
    } else {
      navigation.navigate('SettingDetail', {
        id,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Spinner
        visible={loading}
        textContent={t('Loading')}
        color={'#DF6069'}
        textStyle={styles.spinnerTextStyle}
      />

      <ScrollView>
        {settingsMeta.map((meta, idx) => {
          return (
            <SettingItem
              key={meta.name || idx}
              title={meta.title}
              description={meta.description}
              onPress={() => handleItemPress(meta.name)}
            />
          );
        })}

        <SettingItem
          title={t('Customize virtual buttons')}
          description={t('Customize buttons of virtual gamepad')}
          onPress={() => {
            navigation.navigate('VirtualGamepadSettings');
          }}
        />

        {/* <SettingItem
          title={t('DualSense controller')}
          description={t('Config DualSense controller when use OTG mode')}
          onPress={() => {
            navigation.navigate('DualSense');
          }}
        /> */}

        <SettingItem
          title={t('Configuration Transfer')}
          description={t('TransferDesc')}
          onPress={() => navigation.navigate('Transfer')}
        />

        <SettingItem
          title={t('Reset')}
          description={t('Reset all settings to default')}
          onPress={() => handleItemPress('reset')}
        />

        <View style={styles.contentTitle}>
          <Text variant="titleLarge" style={styles.titleText}>
            {t('Others')}
          </Text>
        </View>
        <SettingItem
          title={t('About')}
          description={`${t('About Peasyo')}\nv${pkg.version}`}
          onPress={() => navigation.navigate('About')}
        />

        {(currentLanguage === 'zh' || currentLanguage === 'zht') && (
          <SettingItem
            title={'支持及交流'}
            description={'支持开发或交流更多串流技术'}
            onPress={() => navigation.navigate('Feedback')}
          />
        )}

        <SettingItem
          title={'DEBUG'}
          description={'Enter debug.'}
          onPress={() => handleItemPress('debug')}
        />

        {token && token.account_id && (
          <SettingItem
            title={t('Logout')}
            description={`
${t('Current')}: ${token.online_id}
PSN ID: ${token.user_id}
            `}
            onPress={() => handleItemPress('logout')}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spinnerTextStyle: {
    color: '#DF6069',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentTitle: {
    padding: 15,
    paddingBottom: 0,
  },
});

export default SettingsScreen;
