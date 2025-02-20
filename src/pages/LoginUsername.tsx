import React from 'react';
import {StyleSheet, View, ScrollView, ToastAndroid} from 'react-native';
import {Button, Text, HelperText, TextInput} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import {TokenStore} from '../store/tokenStore';
import type {PsnUsrtInfo} from '../types';

const LOGIN_URL = 'https://psn.flipscreen.games/search.php';

function LoginUsernameScreen({navigation, route}) {
  const {t} = useTranslation();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');

  React.useEffect(() => {}, [navigation]);

  const handleLogin = () => {
    const _username = username.trim();
    setLoading(true);
    axios
      .get(`${LOGIN_URL}?username=${_username}`)
      .then(res => {
        // console.log(res.data);
        // {"encoded_id": "xxxxx=", "online_id": "xxx", "user_id": "1234567890"}
        if (res && res.data && res.data.user_id) {
          const ts = new TokenStore();
          ts.load();
          const tokens = ts.getToken();
          let isRepeated = false;
          let repeatIdx = -1;
          tokens.forEach((item, idx) => {
            item.is_default = false;
            if (item.user_id === res.data.user_id) {
              isRepeated = true;
              repeatIdx = idx;
            }
          });
          const info: PsnUsrtInfo = {
            is_default: true,
            account_id: res.data.encoded_id,
            online_id: res.data.online_id,
            user_id: res.data.user_id,
          };
          if (isRepeated) {
            tokens[repeatIdx] = info;
          } else {
            tokens.push(info);
          }
          ts.setToken(tokens);
          ts.save();
          ToastAndroid.show(t('Login Successful'), ToastAndroid.SHORT);
          if (route.params?.from === 'add') {
            navigation.navigate('Settings');
          } else {
            navigation.goBack();
          }
        } else {
          ToastAndroid.show(`Login failed: ${res}`, ToastAndroid.LONG);
        }
      })
      .catch(e => {
        const {message} = e;
        if (message.indexOf('404') > -1) {
          ToastAndroid.show(`${t('User_not_found')}`, ToastAndroid.LONG);
        } else {
          ToastAndroid.show('Error:' + message, ToastAndroid.LONG);
        }
      });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.tips}>
          <Text variant="titleMedium">{t('Login_username_title')}</Text>
          <HelperText type="error" visible={true}>
            {t('Login_username_tips')}
          </HelperText>
        </View>
        <TextInput
          label={t('PSN username')}
          value={username}
          onChangeText={text => setUsername(text)}
        />
      </ScrollView>

      <View style={styles.buttonWrap}>
        <Button
          mode="contained"
          disabled={username.trim().length === 0 || loading}
          loading={loading}
          style={styles.button}
          onPress={handleLogin}>
          {t('Login')}
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

export default LoginUsernameScreen;
