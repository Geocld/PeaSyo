import React from 'react';
import {WebView} from 'react-native-webview';
import {debugFactory} from '../utils/debug';

const log = debugFactory('LoginScreen');

const CLIENT_ID = 'ba495a24-818c-472b-b12d-ff231c1b5745';
const CLIENT_SECRET = 'mvaiZkRsAsI1IBkY';

const REDIRECT_URI =
  'https://remoteplay.dl.playstation.net/remoteplay/redirect';

function LoginScreen({navigation, route}) {
  // const [authUrl, setAuthUrl] = React.useState('');

  const LOGIN_URL = `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize?service_entity=urn:service-entity:psn&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=psn:clientapp&request_locale=en_US&ui=pr&service_logo=ps&layout_type=popup&smcid=remoteplay&prompt=always&PlatformPrivacyWs1=minimal&`;

  // React.useEffect(() => {
  //   if (route.params?.authUrl) {
  //     log.info('Receive authUrl:', route.params?.authUrl);
  //     setAuthUrl(route.params?.authUrl);
  //   }
  // }, [route.params?.authUrl]);

  return (
    <WebView
      source={{uri: LOGIN_URL}}
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      cacheEnabled={false}
      onShouldStartLoadWithRequest={request => {
        // log.info('onShouldStartLoadWithRequest:', request);
        if (request.url.startsWith(REDIRECT_URI)) {
          return false;
        }
        return true;
      }}
      onNavigationStateChange={navState => {
        // Keep track of going back navigation within component
        // log.info('onNavigationStateChange:', navState);
        const {url} = navState;
        if (url.startsWith(REDIRECT_URI)) {
          // Save url，return to home
          navigation.navigate({
            name: 'Home',
            params: {xalUrl: url},
            merge: true,
          });
        }
      }}
    />
  );
}

export default LoginScreen;
