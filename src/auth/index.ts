import axios from 'axios';
import {btoa, atob} from 'react-native-quick-base64';
import {Buffer} from '@craftzdog/react-native-buffer';
import 'react-native-url-polyfill/auto';

// Polyfill for axios auth encode
if (!global.btoa) {
  global.btoa = btoa;
}

if (!global.atob) {
  global.atob = atob;
}

const CLIENT_ID = 'ba495a24-818c-472b-b12d-ff231c1b5745';
const CLIENT_SECRET = 'mvaiZkRsAsI1IBkY';
const REDIRECT_URI =
  'https://remoteplay.dl.playstation.net/remoteplay/redirect';

export const getTokenFromRedirectUri = (redirectUri: string): Promise<any> => {
  console.log('getTokenFromRedirectUri redirectUri:', redirectUri);
  return new Promise((resolve, reject) => {
    let accessToken = '';
    let remoteAccessToken = '';
    let refreshToken = '';
    let tokenExpiry = 0;

    const url = new URL(redirectUri);
    const code = url.searchParams.get('code');

    if (code) {
      const auth = {
        username: CLIENT_ID,
        password: CLIENT_SECRET,
      };

      const payload = {
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      };
      const body = new URLSearchParams(payload).toString();

      axios
        .post(
          'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token',
          body,
          {
            auth,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .then(res => {
          // console.log('[getTokenFromRedirectUri] res:', res.data);
          // {"access_token": "1babdde3-48b7-420a-af97-45afb8", "expires_in": 3599, "refresh_token": "1e82-530e-4506-9453-d4357f89", "scope": "psn:clientapp", "token_type": "bearer"}
          if (res.data && res.data.access_token) {
            accessToken = res.data.access_token;
            // Get PSN remote token
            const body2 = new URLSearchParams({
              code,
              grant_type: 'authorization_code',
              scope:
                'psn:clientapp referenceDataService:countryConfig.read pushNotification:webSocket.desktop.connect sessionManager:remotePlaySession.system.update',
              redirect_uri:
                'https://remoteplay.dl.playstation.net/remoteplay/redirect&',
            }).toString();

            axios
              .post(
                'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token',
                body2,
                {
                  auth,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                },
              )
              .then(res2 => {
                remoteAccessToken = res2.data.refresh_token;
                refreshToken = res2.data.refresh_token;
                tokenExpiry =
                  new Date().getTime() + res2.data.expires_in * 1000;
              });
          }
          resolve({
            accessToken,
            remoteAccessToken,
            refreshToken,
            tokenExpiry,
          });
        })
        .catch(e => {
          console.log('[getTokenFromRedirectUri] error:', e);
          reject(e);
        });
    }
  });
};

type UserInfo = {
  scopes: string; // eg: "psn:clientapp",
  expiration: string; // eg: "2021-03-21T15:19:42.198Z",
  client_id: string; // as passed in,
  dcim_id: string; // some kind of UUID,
  grant_type: string; // eg: "authorization_code",
  user_id: string; // a number, This is important for streaming auth
  user_uuid: string; // a UUID,
  online_id: string; // aka username,
  country_code: string; // eg: "US",
  language_code: string; // eg: "en",
  community_domain: string; // eg: "a6",
  is_sub_account: boolean;
  account_id?: string; // Final encode user id
};

export function extractAccountId(accountInfo: UserInfo) {
  const asNumber = BigInt(accountInfo.user_id);
  const buffer = Buffer.alloc(8, 'binary');
  // @ts-ignore
  buffer.writeBigUInt64LE(asNumber, 0);
  return buffer.toString('base64');
}

export const getUserInfoFromToken = (
  token: string,
): Promise<UserInfo | null> => {
  return new Promise((resolve, reject) => {
    const auth = {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    };
    axios
      .get(
        `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token/${token}`,
        {
          auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then(res => {
        console.log('[getUserInfoFromToken] res:', res.data);
        if (res.data) {
          const userInfo = res.data as UserInfo;
          const accountId = extractAccountId(userInfo) || '';
          userInfo.account_id = accountId;

          resolve(userInfo);
        }
      })
      .catch(e => {
        console.log('[getUserInfoFromToken] error:', e);
        reject(e);
      });
  });
};

// TODO
export const refreshAccessToken = (token: string): Promise<any> => {
  console.log('refreshAccessToken:', token);
  return new Promise((resolve, reject) => {
    const auth = {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    };
    const payload = {
      refresh_token: token,
      grant_type: 'refresh_token',
      scope: 'psn:clientapp',
      redirect_uri: REDIRECT_URI,
    };
    const body = new URLSearchParams(payload).toString();

    axios
      .post(
        'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token',
        body,
        {
          auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then(res => {
        console.log('[refreshToken] res:', res.data);
        resolve('');
      })
      .catch(e => {
        console.log('[refreshToken] error:', e);
        reject(e);
      });
  });
};
