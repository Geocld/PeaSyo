import React, {useState, useEffect} from 'react';
import {Alert, StyleSheet, View, ScrollView, ToastAndroid} from 'react-native';
import {TextInput, Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import dayjs from 'dayjs';
import {getConsoles, saveConsoles} from '../store/consolesStore';
import {debugFactory} from '../utils/debug';

const log = debugFactory('ConsoleEditScreen');

type Console = {
  host: string;
  id: string;
  name: string;
  type: string;
};

function ConsoleEditScreen({navigation, route}) {
  const {t} = useTranslation();

  const [consoles, setConsoles] = useState<Console[]>([]);
  const [serverNickname, setServerNickname] = useState('');
  const [host, setHost] = useState('');
  const [remoteHost, setRemoteHost] = useState('');
  const [current, setCurrent] = useState<any>({});

  useEffect(() => {
    const _consoles = getConsoles();
    log.info('consoles:', _consoles);

    const idx = route.params?.idx;
    const consoleItem = _consoles[idx];
    if (consoleItem) {
      setCurrent(consoleItem);
      setServerNickname(consoleItem.serverNickname);
      setHost(consoleItem.host);
      setRemoteHost(consoleItem.remoteHost);
    }
    setConsoles(_consoles);
  }, [route.params?.idx]);

  const handleSave = () => {
    if (!serverNickname) {
      ToastAndroid.show(t('NicknameError'), ToastAndroid.SHORT);
      return;
    }
    if (!host) {
      ToastAndroid.show(t('HostError'), ToastAndroid.SHORT);
      return;
    }

    current.serverNickname = serverNickname;
    current.host = host;
    current.remoteHost = remoteHost;
    const idx = route.params?.idx;
    consoles[idx] = current;

    saveConsoles(consoles);

    ToastAndroid.show(t('Saved'), ToastAndroid.SHORT);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('Warning'), t('ConsoleDeleteWarn'), [
      {
        text: t('Cancel'),
        style: 'cancel',
      },
      {
        text: t('Confirm'),
        style: 'default',
        onPress: () => {
          const idx = route.params?.idx;
          consoles.splice(idx, 1);

          saveConsoles(consoles);
          ToastAndroid.show(t('Saved'), ToastAndroid.SHORT);
          navigation.goBack();
        },
      },
    ]);
  };

  let time = '';
  if (current.registedTime) {
    time = dayjs(current.registedTime).format('YYYY.MM.DD HH:mm');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.wrap}>
        <TextInput
          label={t('ConsoleName')}
          value={serverNickname}
          onChangeText={text => setServerNickname(text)}
        />

        <TextInput
          label={t('Host')}
          value={host}
          onChangeText={text => setHost(text)}
        />

        <TextInput
          label={t('RemoteHost')}
          value={remoteHost}
          onChangeText={text => setRemoteHost(text)}
        />

        <TextInput
          label={t('ConsoleType')}
          value={current.apName || '---'}
          disabled
        />

        <TextInput
          label={t('ConsoleId')}
          value={current.consoleId || '---'}
          disabled
        />

        <TextInput label={t('RegistedTime')} value={time || '---'} disabled />
      </View>

      <View style={[styles.wrap, {paddingBottom: 50}]}>
        <Button mode="outlined" style={styles.button} onPress={handleSave}>
          {t('Save')}
        </Button>
        <Button mode="contained" style={styles.button} onPress={handleDelete}>
          {t('Delete')}
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

export default ConsoleEditScreen;
