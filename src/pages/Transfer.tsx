import React from 'react';
import {StyleSheet, View, Alert, ScrollView, NativeModules} from 'react-native';
import {Button, Text, HelperText, Divider} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import CryptoJS from 'react-native-crypto-js';
import RNRestart from 'react-native-restart';
import {TokenStore} from '../store/tokenStore';

import {getConsoles, saveConsoles} from '../store/consolesStore';

const {LogsModule} = NativeModules;

const SECRET_KEY = 'pEa3yo';

function TransferScreen({navigation}) {
  const {t} = useTranslation();

  React.useEffect(() => {
    return () => {};
  }, [navigation, t]);

  const encrypt = (text: string): string => {
    try {
      const ciphertext = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
      return ciphertext;
    } catch (e) {
      // console.error('encrypt error:', e);
      return '';
    }
  };

  const decrypt = (ciphertext: string): string => {
    try {
      let bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      let originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText;
    } catch (e) {
      // console.error('decrypt error:', e);
      return '';
    }
  };

  const exportConfig = async configData => {
    try {
      const dir = await DocumentPicker.pickDirectory();
      if (!dir) return;

      const path = decodeURIComponent(dir.uri).split(':')[2];
      const fullPath = '/storage/emulated/0/' + path;

      const fileName = `peasyo_export_${new Date().getTime()}.json`;
      const filePath = `${fullPath}/${fileName}`;

      const jsonStr = JSON.stringify(configData, null, 2);

      const encryptStr = encrypt(jsonStr);

      if (!encryptStr) {
        return {
          success: false,
          message: t('ExportFail') + ':' + 'encrypt string is empty',
        };
      }

      await RNFS.writeFile(filePath, encryptStr, 'utf8');

      return {
        success: true,
        message: t('ExportSuccess'),
        filePath,
      };
    } catch (error: any) {
      return {
        success: false,
        message: t('ExportFail') + ':' + error.message,
      };
    }
  };

  const shareConfig = async () => {
    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    const consoles = getConsoles();

    const configs = {
      tokens,
      consoles,
    };

    const jsonStr = JSON.stringify(configs);

    const encryptStr = encrypt(jsonStr);

    if (!encryptStr) {
      Alert.alert('Warning', t('ExportFail') + ':' + 'encrypt string is empty');
      return;
    }

    LogsModule.createAndShareConfigFile(encryptStr);
  };

  const importConfig = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: ['application/json'],
      });

      const fileContent = await RNFS.readFile(result[0].uri, 'utf8');

      const configStr = decrypt(fileContent);
      if (!configStr) {
        return {
          success: false,
          message: t('ImportFail') + ':' + 'config string is empty',
        };
      }

      const configData = JSON.parse(configStr);

      return {
        success: true,
        data: configData,
        message: t('ImportSuccess'),
      };
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        return {
          success: false,
          message: t('UserCancel'),
        };
      }
      return {
        success: false,
        message: t('ImportFail') + ':' + error.message,
      };
    }
  };

  const handleExport = async () => {
    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    const consoles = getConsoles();

    const configs = {
      tokens,
      consoles,
    };

    // const hasPermission = await requestStoragePermission();

    // if (!hasPermission) {
    //   Alert.alert(t('Warning'), t('NoPermission'));
    //   return;
    // }

    const result: any = await exportConfig(configs);
    Alert.alert('Warning', result.message);
  };

  const handleImport = async () => {
    // const hasPermission = await requestStoragePermission();
    // if (!hasPermission) {
    //   Alert.alert(t('Warning'), t('NoPermission'));
    //   return;
    // }

    const result = await importConfig();
    if (result.success) {
      const configs = result.data;
      const {tokens, consoles} = configs;

      // Save token
      const ts = new TokenStore();
      ts.setToken(tokens);
      ts.save();

      // Save consoles
      saveConsoles(consoles);
      Alert.alert(t('Warning'), result.message);
      setTimeout(() => {
        RNRestart.restart();
      }, 1000);
    } else {
      Alert.alert(t('Warning'), result.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.block}>
        <Text style={styles.title} variant="titleMedium">
          {t('ExportDesc')}
        </Text>
        <HelperText type="error" visible={true}>
          {t('ExportTips')}
        </HelperText>
        <Button mode="contained" onPress={handleExport}>
          {t('ExportSettings')}
        </Button>
        <HelperText type="error" visible={true} style={{marginTop: 10}}>
          {t('ConfigShareTips')}
        </HelperText>
        <Button mode="contained" onPress={shareConfig}>
          {t('Share')}
        </Button>
      </View>

      <Divider />

      <View style={styles.block}>
        <Text style={styles.title} variant="titleMedium">
          {t('ImportDesc')}
        </Text>
        <Button mode="contained" onPress={handleImport}>
          {t('ImportSettings')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  block: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    paddingBottom: 10,
  },
});

export default TransferScreen;
