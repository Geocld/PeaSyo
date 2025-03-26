import React from 'react';
import {NativeModules} from 'react-native';
import {WebView} from 'react-native-webview';
import {debugFactory} from '../utils/debug';

const log = debugFactory('LoginScreen');

const CLIENT_ID = 'ba495a24-818c-472b-b12d-ff231c1b5745';

const REDIRECT_URI =
  'https://remoteplay.dl.playstation.net/remoteplay/redirect';

const LOGIN_URL = `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize?service_entity=urn:service-entity:psn&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=psn:clientapp referenceDataService:countryConfig.read pushNotification:webSocket.desktop.connect sessionManager:remotePlaySession.system.update&request_locale=en_US&ui=pr&service_logo=ps&layout_type=popup&smcid=remoteplay&prompt=always&PlatformPrivacyWs1=minimal&`;

const {HolepunchManager} = NativeModules;

function LoginScreen({navigation, route}) {
  const [loginUrl, setLoginUrl] = React.useState('');

  React.useEffect(() => {
    const duid = HolepunchManager.getDeviceUid();
    setLoginUrl(`${LOGIN_URL}duid=${duid}&`);
  }, []);

  console.log('loginUrl:', loginUrl);

  return (
    <>
      {loginUrl && (
        <WebView
          source={{uri: loginUrl}}
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
          cacheMode={'LOAD_NO_CACHE'}
          cacheEnabled={false}
          incognito={true}
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
      )}
    </>
  );
}

export default LoginScreen;
