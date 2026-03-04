import React from 'react';
import {
  NativeModules,
  View,
  ScrollView,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import {Button, Text, TextInput, Divider} from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import {debugFactory} from '../utils/debug';
import LinkText from '../components/LinkText';
import Clipboard from '@react-native-clipboard/clipboard';
import {useTranslation} from 'react-i18next';

const CLIENT_ID = 'ba495a24-818c-472b-b12d-ff231c1b5745';

const REDIRECT_URI =
  'https://remoteplay.dl.playstation.net/remoteplay/redirect';

const LOGIN_URL = `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize?service_entity=urn:service-entity:psn&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=psn:clientapp referenceDataService:countryConfig.read pushNotification:webSocket.desktop.connect sessionManager:remotePlaySession.system.update&request_locale=en_US&ui=pr&service_logo=ps&layout_type=popup&smcid=remoteplay&prompt=always&PlatformPrivacyWs1=minimal&`;

const {HolepunchManager} = NativeModules;

const log = debugFactory('ManualLoginScreen');

function ManualLoginScreen({navigation}) {
  const {t} = useTranslation();
  const [loginUrl, setLoginUrl] = React.useState('');
  const [redirectUrl, setRedirectUrl] = React.useState('');

  React.useEffect(() => {
    const duid = HolepunchManager.getDeviceUid();
    setLoginUrl(`${LOGIN_URL}duid=${duid}&`);
  }, []);

  log.info('loginUrl:', loginUrl);

  return (
    <ScrollView style={styles.container}>
      <Spinner
        visible={!loginUrl}
        cancelable={true}
        color={'#DF6069'}
        overlayColor={'rgba(0, 0, 0, 0)'}
      />
      <Text variant="titleMedium">{t('ManualLogin_issue_tips')}</Text>

      <View style={styles.mt20}>
        <Text variant="titleMedium">{t('ManualLogin_manual_steps')}</Text>

        <View style={styles.center}>
          <LinkText url={loginUrl}>{t('ManualLogin_open_link')}</LinkText>
        </View>

        <Button
          style={styles.mt20}
          mode="outlined"
          onPress={() => {
            Clipboard.setString(loginUrl);
            ToastAndroid.show(t('Copied'), ToastAndroid.SHORT);
          }}>
          {t('CopyLink')}
        </Button>

        <Text variant="titleMedium" style={styles.mt20}>
          {t('ManualLogin_redirect_tips')}
        </Text>
        <TextInput
          label={t('ManualLogin_redirect_url_label')}
          value={redirectUrl}
          onChangeText={text => setRedirectUrl(text)}
        />

        <Button
          style={[styles.mt20, styles.mb20]}
          mode="contained"
          disabled={!redirectUrl}
          onPress={() => {
            if (
              !redirectUrl.startsWith('https') ||
              redirectUrl.indexOf('code=') === -1
            ) {
              return;
            }
            navigation.navigate({
              name: 'Home',
              params: {xalUrl: redirectUrl},
              merge: true,
            });
          }}>
          {t('Confirm')}
        </Button>

        <Divider />

        <View style={styles.mt20}>
          <Text variant="titleMedium">
            {t('ManualLogin_local_stream_tips')}
          </Text>

          <Button
            style={styles.mt20}
            mode="text"
            onPress={() => {
              navigation.navigate({
                name: 'Home',
              });
            }}>
            {t('Back')}
          </Button>
        </View>
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
  center: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  mt20: {
    marginTop: 20,
  },
  mb20: {
    marginBottom: 20,
  },
});

export default ManualLoginScreen;
