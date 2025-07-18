import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  FlatList,
  Dimensions,
  NativeModules,
  ToastAndroid,
  Pressable,
} from 'react-native';
import {
  Button,
  Text,
  Portal,
  Dialog,
  TextInput,
  IconButton,
} from 'react-native-paper';
import RNRestart from 'react-native-restart';
import CookieManager from '@react-native-cookies/cookies';
import {useFocusEffect} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Spinner from 'react-native-loading-spinner-overlay';
import {getIpAddressesForHostname} from 'react-native-dns-lookup';
import {useIsFocused} from '@react-navigation/native';
import ConsoleItem from '../components/ConsoleItem';

import SplashScreen from 'react-native-splash-screen';
import {useTranslation} from 'react-i18next';
import {debugFactory} from '../utils/debug';
import {
  getTokenFromRedirectUri,
  getUserInfoFromToken,
  refreshAccessToken,
} from '../auth';
import {TokenStore} from '../store/tokenStore';
import {getSettings} from '../store/settingStore';
import {getConsoles, saveConsoles} from '../store/consolesStore';
import {discoverDevices} from '../discovery';
import {wakeup} from '../wakeup';
import {DOMAIN_REGEX} from '../common';

const {RegistryManager, UsbRumbleManager} = NativeModules;

const log = debugFactory('HomeScreen');

function HomeScreen({navigation, route}) {
  const {t} = useTranslation();
  const [settings, setSettings] = React.useState({});
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [currentConsole, setCurrentConsole] = useState(null);
  const [remoteHost, setRemoteHost] = useState('');
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showWakeModal, setShowWakeModal] = useState(false);
  const [isConnected, setIsConnected] = React.useState(true);

  const [isLogined, setIsLogined] = useState(false);
  const [consoles, setConsoles] = useState([]);
  const [numColumns, setNumColumns] = React.useState(2);

  const isFocused = useIsFocused();
  const _isFocused = React.useRef(isFocused);

  const ref = React.useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      log.info('Refreshing HomeScreen');
      const ts = new TokenStore();
      ts.load();
      const tokens = ts.getToken();
      if (tokens.length > 0) {
        setIsLogined(true);
      }
      const _consoles = getConsoles();
      log.info('consoles:', _consoles);
      setConsoles(_consoles);

      const _settings = getSettings();
      setSettings(_settings);
    }, []),
  );

  React.useEffect(() => {
    log.info('Page loaded.');
    SplashScreen.hide();

    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <IconButton
          icon="progress-wrench"
          size={26}
          onPress={() => {
            navigation.navigate('Options');
          }}
        />
      ),
    });

    const unsubscribe = NetInfo.addEventListener(_state => {
      setIsConnected(_state.isConnected);
    });

    const ts = new TokenStore();

    if (_isFocused.current) {
      log.info('HomeScreen isFocused:', _isFocused.current);

      // Check login
      if (!route.params?.xalUrl) {
        ts.load();
        const tokens = ts.getToken();
        log.info('tokens:', tokens);
        if (tokens.length > 0) {
          setIsLogined(true);

          // Get consoles
          const _consoles = getConsoles();
          log.info('consoles:', _consoles);
          setConsoles(_consoles);
        }
      }

      // Return from Login screen
      if (route.params?.xalUrl) {
        const xalUrl = route.params?.xalUrl;
        // console.log('xalUrl:', xalUrl);

        setLoading(true);
        setLoadingText(t('Loading'));
        // Get token from auth code
        getTokenFromRedirectUri(xalUrl)
          .then(tokenRes => {
            const {accessToken, refreshToken, tokenExpiry} = tokenRes;
            // console.log('Get access token:', accessToken);
            if (accessToken.length) {
              getUserInfoFromToken(accessToken)
                .then(userInfo => {
                  // Save token(userInfo) to local storege
                  ts.load();
                  const tokens = ts.getToken();
                  let isExist = false;
                  tokens.forEach(item => {
                    item.is_default = false;
                    if (item.user_id === userInfo.user_id) {
                      isExist = true;
                    }
                  });

                  if (!isExist) {
                    tokens.push({
                      is_default: true,
                      ...userInfo,
                      accessToken,
                      refreshToken,
                      tokenExpiry,
                    });

                    ts.setToken(tokens);
                    ts.save();
                  }

                  ToastAndroid.show(t('Login Successful'), ToastAndroid.SHORT);
                  setLoading(false);
                  setIsLogined(true);
                })
                .catch(e => {
                  ToastAndroid.show(
                    t('Unable to Fetch User Information') + ':' + e,
                    ToastAndroid.LONG,
                  );
                  setLoading(false);
                });
            } else {
              ToastAndroid.show(
                t('LoginFailWithAccessTokenIsNull'),
                ToastAndroid.LONG,
              );
              setLoading(false);
            }
          })
          .catch(e => {
            ToastAndroid.show(
              t('Get access_token failed') + ':' + e,
              ToastAndroid.LONG,
            );
          });
      }
    }

    const updateLayout = () => {
      const {width, height} = Dimensions.get('window');
      setNumColumns(width > height ? 3 : 2);
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);

    return () => {
      subscription?.remove();
      unsubscribe();
    };
  }, [t, route.params?.xalUrl, navigation]);

  const renderLogin = () => {
    return (
      <View>
        <Text style={styles.title}>{t('NoLogin')}</Text>
        <Button mode="outlined" onPress={() => navigation.navigate('Login')}>
          &nbsp;{t('Login')}&nbsp;
        </Button>

        <View style={{marginTop: 20}}>
          <Text variant="bodyMedium" style={{textAlign: 'center'}}>
            {t('Login_PSN_Username')}
          </Text>
          <Button
            mode="text"
            onPress={() => {
              navigation.navigate({
                name: 'LoginUsername',
                params: {
                  from: 'home',
                },
              });
            }}>
            {t('Login_with_username')}
          </Button>
        </View>
      </View>
    );
  };

  const renderRegistry = () => {
    return (
      <View>
        <Text style={styles.title}>{t('NoRegistry')}</Text>
        <Button
          mode="contained"
          onPress={() => {
            navigation.navigate('Registry');
          }}>
          &nbsp;{t('Registry')}&nbsp;
        </Button>
      </View>
    );
  };

  const renderContent = () => {
    if (!isLogined) {
      return <View style={styles.centerContainer}>{renderLogin()}</View>;
    } else if (isLogined && !consoles.length) {
      return <View style={styles.centerContainer}>{renderRegistry()}</View>;
    } else if (consoles.length) {
      return (
        <>
          <FlatList
            data={consoles}
            numColumns={numColumns}
            key={numColumns}
            contentContainerStyle={styles.listContainer}
            renderItem={({item}) => {
              return (
                <View
                  style={[
                    styles.consoleItem,
                    numColumns === 3 ? styles.listItemH : styles.listItemV,
                  ]}>
                  <ConsoleItem
                    consoleItem={item}
                    onPress={() => handleLocalStream(item)}
                    onPressRemote={() => handleRemoteStream(item)}
                  />
                </View>
              );
            }}
          />
        </>
      );
    } else {
      return null;
    }
  };

  const handleLocalStream = item => {
    if (!isConnected) {
      noNetWarning();
      return;
    }

    const isPS5 = item.apName.indexOf('PS5') > -1;

    setLoading(true);
    setLoadingText(t('FindConsole'));
    // Find local console
    discoverDevices(isPS5)
      .then(results => {
        if (results.length) {
          let hasMatch = false;
          results.forEach(res => {
            if (
              res.id === item.consoleId ||
              res.address.address === item.host
            ) {
              hasMatch = true;
              // Update console host
              if (item.host !== res.address.address) {
                item.host = res.address.address;
              }

              if (res.status === 'STANDBY') {
                setLoadingText(t('Waking'));

                const credential = RegistryManager.getCredential(
                  item.rpRegistKey,
                );
                if (!credential) {
                  ToastAndroid.show(t('CredentialIsEmpty'), ToastAndroid.SHORT);
                  return;
                }
                // Send wake packet
                wakeup(item.host, credential, isPS5);

                setTimeout(() => {
                  wakeup(item.host, credential, isPS5);

                  setTimeout(() => {
                    handleToLocalStream(item);
                  }, 20 * 1000);
                }, 5000);
              } else if (res.status === 'AWAKE') {
                // To Stream page
                handleToLocalStream(item);
              } else {
                Alert.alert(t('Warning'), t('ConSoleNotFound'), [
                  {
                    text: t('Confirm'),
                    style: 'default',
                  },
                ]);
              }
            }
          });

          if (!hasMatch) {
            setLoading(false);
            handleToLocalStream(item);
          }
        } else {
          setLoading(false);
          handleToLocalStream(item);
        }
      })
      .catch(e => {
        ToastAndroid.show(e, ToastAndroid.LONG);
        setLoading(false);
      });
  };

  const handleToLocalStream = item => {
    const hasValidUsbDevice = UsbRumbleManager.getHasValidUsbDevice();
    const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;

    setLoading(false);
    navigation.navigate({
      name: 'Stream',
      params: {
        consoleInfo: item,
        isRemote: false,
        isUsbMode,
      },
    });
  };

  const handleRemoteStream = item => {
    if (!isConnected) {
      noNetWarning();
      return;
    }
    setCurrentConsole(item);
    setShowRemoteModal(true);
    setRemoteHost(item.remoteHost || '');
  };

  const handleToLogin = () => {
    const ts = new TokenStore();
    Alert.alert(t('Warning'), t('Token is expired, Please login'), [
      {
        text: t('Cancel'),
        style: 'default',
        onPress: () => {},
      },
      {
        text: t('Login'),
        style: 'default',
        onPress: () => {
          ts.clear();
          CookieManager.clearAll();
          setTimeout(() => {
            RNRestart.restart();
          }, 1000);
        },
      },
    ]);
  };

  const handleAutoRemoteStream = () => {
    if (!isConnected) {
      noNetWarning();
      return;
    }
    setShowRemoteModal(false);
    setLoading(true);
    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    if (!tokens.length) {
      handleToLogin();
      return;
    }

    let token = tokens[0];

    tokens.forEach(item => {
      if (item.is_default) {
        token = item;
      }
    });

    const {accessToken, refreshToken, tokenExpiry} = token;

    if (!accessToken || !refreshToken) {
      handleToLogin();
      return;
    }

    // token已过期，需刷新
    if (new Date().getTime() - tokenExpiry > 0) {
      // refresh token
      refreshAccessToken(refreshToken)
        .then(res => {
          if (res) {
            const {access_token, refresh_token, expires_in} = res;
            tokens[0].accessToken = access_token;
            tokens[0].refreshToken = refresh_token;
            tokens[0].tokenExpiry = new Date().getTime() + expires_in * 1000;
            ts.setToken(tokens);
            ts.save();
            setTimeout(() => {
              setLoading(false);
              navigation.navigate({
                name: 'Stream',
                params: {
                  consoleInfo: {
                    ...currentConsole,
                    accessToken,
                    psnAccountId: token.account_id,
                  },
                },
              });
            }, 500);
          }
        })
        .catch(e => {
          setLoading(false);
          handleToLogin();
        });
    } else {
      console.log('psnAccountId:', token.account_id);
      setTimeout(() => {
        setLoading(false);
        navigation.navigate({
          name: 'Stream',
          params: {
            consoleInfo: {
              ...currentConsole,
              accessToken,
              psnAccountId: token.account_id,
            },
          },
        });
      }, 500);
    }
  };

  const handleCloseRemoteModal = () => {
    setShowRemoteModal(false);
  };

  const handleSaveRemoteHost = () => {
    if (!remoteHost) {
      ToastAndroid.show(t('RemoteAddressCannotEmpty'), ToastAndroid.SHORT);
      return;
    }
    consoles.forEach(item => {
      if (item.consoleId === currentConsole.consoleId) {
        item.remoteHost = remoteHost;
      }
    });
    saveConsoles(consoles);
    setConsoles(consoles);
    handleCloseRemoteModal();
    setTimeout(() => {
      setShowWakeModal(true);
    }, 300);
  };

  const handleCloseWakeModal = () => {
    setShowWakeModal(false);
  };

  const handleOnlyConnect = () => {
    setShowWakeModal(false);
    const hasValidUsbDevice = UsbRumbleManager.getHasValidUsbDevice();
    const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;
    navigation.navigate({
      name: 'Stream',
      params: {
        consoleInfo: currentConsole,
        isRemote: true,
        isUsbMode,
      },
    });
  };

  const handleWakeAndConnect = () => {
    setShowWakeModal(false);
    setLoading(true);
    const credential = RegistryManager.getCredential(
      currentConsole.rpRegistKey,
    );
    if (!credential) {
      ToastAndroid.show(t('CredentialIsEmpty'), ToastAndroid.SHORT);
      return;
    }
    if (!currentConsole.remoteHost) {
      ToastAndroid.show(t('RemoteAddressCannotEmpty'), ToastAndroid.SHORT);
      return;
    }
    // Parse domain
    if (DOMAIN_REGEX.test(currentConsole.remoteHost)) {
      getIpAddressesForHostname(currentConsole.remoteHost)
        .then(ipAddresses => {
          if (ipAddresses.length) {
            handleWakeAndToStream(ipAddresses[0], credential);
          } else {
            setLoading(false);
            Alert.alert(t('Warning'), t('ParseError101'), [
              {
                text: t('Confirm'),
                style: 'default',
              },
            ]);
          }
        })
        .catch(e => {
          setLoading(false);
          Alert.alert(t('Warning'), t('ParseError102'), [
            {
              text: t('Confirm'),
              style: 'default',
            },
          ]);
        });
    } else {
      // ipv4/6
      handleWakeAndToStream(currentConsole.remoteHost, credential);
    }
  };

  const handleWakeAndToStream = (host, credential) => {
    const isPS5 = currentConsole.apName.indexOf('PS5') > -1;
    log.info('handleWakeAndToStream', host, credential);
    const hasValidUsbDevice = UsbRumbleManager.getHasValidUsbDevice();
    const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;

    wakeup(host, credential, isPS5);
    currentConsole.parsedHost = host;

    setLoadingText(t('Waking'));
    // Wait for one min
    setTimeout(() => {
      setLoading(false);
      navigation.navigate({
        name: 'Stream',
        params: {
          consoleInfo: currentConsole,
          isRemote: true,
          isUsbMode,
        },
      });
    }, 45 * 1000);
  };

  const noNetWarning = () => {
    Alert.alert(
      t('Warning'),
      t('Currently no network connection, please connect and try again'),
      [
        {
          text: t('Confirm'),
          style: 'default',
          onPress: () => {},
        },
      ],
    );
  };

  return (
    <>
      <Portal>
        <Dialog visible={showRemoteModal} onDismiss={handleCloseRemoteModal}>
          <Dialog.Content>
            <View>
              <Text variant="bodyMedium" style={styles.modalContent}>
                {t('RemoteDesc')}
              </Text>
            </View>
            {settings.auto_remote && (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text>{t('AutoRemoteDesc')}</Text>
                <Button type="text" onPress={handleAutoRemoteStream}>
                  {t('Start')}
                </Button>
              </View>
            )}
            <Pressable
              onPress={() => {
                if (ref && typeof ref !== 'function' && ref.current) {
                  // @ts-ignore
                  ref.current.focus();
                }
              }}>
              <TextInput
                label={t('RemoteHost')}
                ref={ref}
                value={remoteHost}
                style={styles.textCenter}
                onChangeText={text => setRemoteHost(text.trim())}
              />
            </Pressable>
            <Button
              mode="text"
              style={{marginTop: 10}}
              onPress={handleSaveRemoteHost}>
              {t('Confirm')}
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showWakeModal} onDismiss={handleCloseWakeModal}>
          <Dialog.Title>{t('WakeConsole')}</Dialog.Title>
          <Dialog.Content style={styles.modalContent}>
            <Text variant="bodyMedium">{t('WakeDesc')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleOnlyConnect}>{t('OnlyConnect')}</Button>
            <Button onPress={handleWakeAndConnect}>
              {t('WakeAndConnect')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Spinner
        visible={loading}
        cancelable={true}
        color={'#DF6069'}
        textContent={loadingText}
        textStyle={styles.spinnerTextStyle}
      />

      {renderContent()}
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalContent: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  textCenter: {
    textAlign: 'center',
  },
  spinnerTextStyle: {
    color: '#DF6069',
    textAlign: 'center',
  },
  listContainer: {},
  consoleItem: {
    padding: 10,
  },
  listItemH: {
    width: '30%',
    justifyContent: 'center',
  },
  listItemV: {
    width: '50%',
    justifyContent: 'center',
  },
});

export default HomeScreen;
