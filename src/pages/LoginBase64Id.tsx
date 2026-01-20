import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ToastAndroid,
  Pressable,
} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {KeyboardFocusView} from 'react-native-a11y';
import {TokenStore} from '../store/tokenStore';
import type {PsnUsrtInfo} from '../types';

function LoginBase64IdScreen({navigation, route}) {
  const {t} = useTranslation();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');
  const ref = React.useRef(null);

  React.useEffect(() => {}, [navigation]);

  const handleLogin = () => {
    setLoading(true);
    const accountId = username.trim();
    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    let isRepeated = false;
    let repeatIdx = -1;
    tokens.forEach((item, idx) => {
      item.is_default = false;
      if (item.user_id === accountId) {
        isRepeated = true;
        repeatIdx = idx;
      }
    });
    const info: PsnUsrtInfo = {
      is_default: true,
      account_id: accountId,
      online_id: accountId,
      user_id: accountId,
    };
    if (isRepeated) {
      tokens[repeatIdx] = info;
    } else {
      tokens.push(info);
    }
    ts.setToken(tokens);
    ts.save();
    setLoading(false);
    ToastAndroid.show(t('Login Successful'), ToastAndroid.SHORT);
    if (route.params?.from === 'add') {
      navigation.navigate('Settings');
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.tips}>
          <Text variant="titleMedium">{t('Login_base64_title')}</Text>
        </View>
        <KeyboardFocusView
          onFocusChange={e => {
            if (e.nativeEvent.isFocused) {
              if (ref && typeof ref !== 'function' && ref.current) {
                // @ts-ignore
                ref.current.focus();
              }
            }
          }}>
          <Pressable style={{padding: 5}}>
            <TextInput
              label={t('Account ID') + ' (Base64)'}
              ref={ref}
              value={username}
              onChangeText={text => setUsername(text)}
            />
          </Pressable>
        </KeyboardFocusView>
      </ScrollView>

      <View style={styles.buttonWrap}>
        <Button
          mode="contained"
          disabled={username.trim().length === 0 || loading}
          loading={loading}
          style={styles.button}
          onPress={handleLogin}>
          {t('Confirm')}
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

export default LoginBase64IdScreen;
