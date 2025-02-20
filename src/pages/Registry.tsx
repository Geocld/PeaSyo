import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  NativeModules,
  ToastAndroid,
} from 'react-native';
import {
  TextInput,
  Button,
  RadioButton,
  Text,
  Divider,
} from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import {useTranslation} from 'react-i18next';
import uuid from 'react-native-uuid';
import {discoverDevices, type IDiscoveredDevice} from '../discovery';
import {TokenStore} from '../store/tokenStore';
import {getConsoles, saveConsoles} from '../store/consolesStore';
import {DiscoveryVersions} from '../common';
import {debugFactory} from '../utils/debug';
import type {RegistedInfo, UserInfo, PsnUsrtInfo} from '../types';

const log = debugFactory('xCloud/index.js');

const {RegistryManager} = NativeModules;

type Console = {
  host: string;
  id: string;
  name: string;
  type: string;
};

function RegistryScreen({navigation}) {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const [host, setHost] = useState('');
  const [pin, setPin] = useState('');
  const [consoles, setConsoles] = useState<Console[]>([]);

  const [currentConsoleId, setCurrentConsoleId] = useState('');

  const [dicoverVersion, setDicoverVersion] = useState(DiscoveryVersions.PS5);

  React.useEffect(() => {
    setLoading(true);
    setLoadingText(t('LookConsole'));

    discoverDevices(true).then((results: IDiscoveredDevice[]) => {
      // console.log('consoles:', results);
      let _consoles: Console[] = [];
      const idRecord: string[] = [];

      results.forEach((res: IDiscoveredDevice) => {
        if (idRecord.indexOf(res.id) === -1) {
          _consoles.push({
            host: res.address.address,
            id: res.id,
            name: res.name,
            type: res.type,
          });
          idRecord.push(res.id);
        }
      });

      setConsoles(_consoles);

      if (_consoles.length) {
        setCurrentConsoleId(_consoles[0].id);
        setHost(_consoles[0].host);
      }

      setLoading(false);
    });
  }, [navigation, t]);

  const handleConfirm = () => {
    if (!host.trim()) {
      ToastAndroid.show(t('HostError'), ToastAndroid.SHORT);
      return;
    }
    if (!pin.trim()) {
      ToastAndroid.show(t('PINError'), ToastAndroid.SHORT);
      return;
    }
    if (pin.trim().length < 8) {
      ToastAndroid.show(t('PINLenError'), ToastAndroid.SHORT);
      return;
    }
    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    if (tokens.length === 0) {
      ToastAndroid.show(t('TokenisEmpty'), ToastAndroid.SHORT);
      return;
    }

    let currentUser: UserInfo | PsnUsrtInfo | undefined;
    tokens.forEach(item => {
      if (item.is_default) {
        currentUser = item;
      }
    });

    if (!currentUser) {
      ToastAndroid.show(t('TokenisEmpty'), ToastAndroid.SHORT);
      return;
    }

    RegistryManager.registry(
      dicoverVersion === DiscoveryVersions.PS5 ? 1000100 : 1000, // (PS5-1000100, PS4(10)-1000)
      host, // host,eg. 192.168.1.1
      false, // broadcast - false
      currentUser.account_id, // psnId -> token.account_id
      parseInt(pin, 10), // PIN
    ).then((result: RegistedInfo) => {
      log.info('registry result:', result);
      if (!result.rpKey) {
        Alert.alert(t('Warning'), t('RegistFailed'), [
          {
            text: t('Confirm'),
            style: 'default',
          },
        ]);
        return;
      }

      // Save regist infos
      const registedConsole = {
        ...result,
        consoleId: currentConsoleId || uuid.v4(),
        host,
        remoteHost: '',
        registedTime: new Date().getTime(),
      };
      log.info('registedConsole:', registedConsole);
      const _consoles = getConsoles();
      _consoles.push(registedConsole);

      saveConsoles(_consoles);
      ToastAndroid.show(t('RegistrySuccess'), ToastAndroid.SHORT);
      navigation.navigate({
        name: 'Home',
      });
    });
  };

  const handleChangeConsoleType = value => {
    setDicoverVersion(value);

    setLoading(true);
    setLoadingText(t('LookConsole'));
    const isPS5 = value === DiscoveryVersions.PS5;
    discoverDevices(isPS5).then((results: IDiscoveredDevice[]) => {
      let _consoles: Console[] = [];
      const idRecord: string[] = [];

      results.forEach((res: IDiscoveredDevice) => {
        if (idRecord.indexOf(res.id) === -1) {
          _consoles.push({
            host: res.address.address,
            id: res.id,
            name: res.name,
            type: res.type,
          });
          idRecord.push(res.id);
        }
      });

      setConsoles(_consoles);

      if (_consoles.length) {
        setCurrentConsoleId(_consoles[0].id);
        setHost(_consoles[0].host);
      }

      setLoading(false);
    });
  };

  const handleSelectConsole = value => {
    setCurrentConsoleId(value);
    consoles.forEach(console => {
      if (console.id === value) {
        setHost(console.host);
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Spinner
        visible={loading}
        color={'#DF6069'}
        textContent={loadingText}
        textStyle={styles.spinnerTextStyle}
      />

      <Text style={styles.tips} variant="titleMedium">
        {t('RegistTips')}
      </Text>

      <View>
        <Text variant="titleMedium">{t('SelectConsoleType')}</Text>
        <RadioButton.Group
          onValueChange={handleChangeConsoleType}
          value={dicoverVersion}>
          <RadioButton.Item label={'PS5'} value={DiscoveryVersions.PS5} />
          <RadioButton.Item label={'PS4'} value={DiscoveryVersions.PS4} />
        </RadioButton.Group>
      </View>

      <Divider />

      {!loading && (
        <View style={styles.wrap}>
          {consoles.length ? (
            <View>
              <Text variant="titleMedium">{t('SelectConsole')}</Text>
              <RadioButton.Group
                onValueChange={handleSelectConsole}
                value={currentConsoleId}>
                {consoles.map(console => {
                  return (
                    <RadioButton.Item
                      label={console.name}
                      value={console.id}
                      key={console.id}
                    />
                  );
                })}
              </RadioButton.Group>
            </View>
          ) : (
            <View>
              <Text variant="titleMedium">{t('NoConsole')}</Text>
            </View>
          )}
        </View>
      )}

      <Divider />

      <View style={styles.wrap}>
        <TextInput
          label={t('Host')}
          value={host}
          onChangeText={text => setHost(text)}
        />

        <TextInput
          label="PIN"
          value={pin}
          onChangeText={text => setPin(text)}
        />
      </View>

      <View style={[styles.wrap, {paddingBottom: 50}]}>
        <Button mode="contained" style={styles.button} onPress={handleConfirm}>
          {t('Confirm')}
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={() => navigation.goBack()}>
          {t('Back')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  tips: {
    marginBottom: 10,
  },
  wrap: {
    paddingTop: 30,
  },
  button: {
    marginBottom: 10,
  },
  spinnerTextStyle: {
    color: '#DF6069',
    textAlign: 'center',
  },
});

export default RegistryScreen;
