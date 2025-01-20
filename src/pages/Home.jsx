import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  NativeModules,
  ToastAndroid,
} from 'react-native';
import {Button, Text, Portal, Dialog, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import Spinner from 'react-native-loading-spinner-overlay';
import {getIpAddressesForHostname} from 'react-native-dns-lookup';
import {useIsFocused} from '@react-navigation/native';
import ConsoleItem from '../components/ConsoleItem';

import SplashScreen from 'react-native-splash-screen';
import {useTranslation} from 'react-i18next';
import {debugFactory} from '../utils/debug';
import {getTokenFromRedirectUri, getUserInfoFromToken} from '../auth';
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
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [currentConsole, setCurrentConsole] = useState(null);
  const [remoteHost, setRemoteHost] = useState('');
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showWakeModal, setShowWakeModal] = useState(false);

  const [isLogined, setIsLogined] = useState(false);
  const [consoles, setConsoles] = useState([]);

  const isFocused = useIsFocused();
  const _isFocused = React.useRef(isFocused);

  useFocusEffect(
    React.useCallback(() => {
      log.info('Refreshing HomeScreen');
      const _consoles = getConsoles();
      log.info('consoles:', _consoles);
      setConsoles(_consoles);
    }, []),
  );

  React.useEffect(() => {
    log.info('Page loaded.');
    SplashScreen.hide();

    const ts = new TokenStore();

    if (_isFocused.current) {
      log.info('HomeScreen isFocused:', _isFocused.current);

      // Check login
      if (!route.params?.xalUrl) {
        ts.load();
        const token = ts.getToken();
        log.info('token:', token);
        if (token.account_id) {
          setIsLogined(true);

          // Get consoles
          const _consoles = getConsoles();
          log.info('consoles:', _consoles);
          setConsoles(_consoles);

          if (_consoles.length) {
            navigation.setOptions({
              headerRight: () => (
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Registry')}>
                  {t('Registry')}
                </Button>
              ),
            });
          }
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
          .then(accessToken => {
            // console.log('Get access token:', accessToken);
            if (accessToken.length) {
              getUserInfoFromToken(accessToken)
                .then(userInfo => {
                  // Save token(userInfo) to local storege
                  ts.setToken(userInfo);
                  ts.save();

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
  }, [t, route.params?.xalUrl, navigation]);

  const renderLogin = () => {
    return (
      <View>
        <Text style={styles.title}>{t('NoLogin')}</Text>
        <Button mode="outlined" onPress={() => navigation.navigate('Login')}>
          &nbsp;{t('Login')}&nbsp;
        </Button>
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
        <View>
          {consoles.map((item, idx) => {
            return (
              <ConsoleItem
                key={idx}
                consoleItem={item}
                onPress={() => handleLocalStream(item)}
                onPressRemote={() => handleRemoteStream(item)}
              />
            );
          })}
        </View>
      );
    } else {
      return null;
    }
  };

  const checkConsoleWake = (isPS5, item, attempts = 0) => {
    const MAX_ATTEMPTS = 10;

    return new Promise((resolve, reject) => {
      discoverDevices(isPS5)
        .then(results => {
          if (results.length) {
            results.forEach(res => {
              if (res.address.address === item.host) {
                if (res.status === 'STANDBY' && attempts < MAX_ATTEMPTS) {
                  // Continue to check if under max attempts
                  setTimeout(() => {
                    checkConsoleWake(isPS5, item, attempts + 1)
                      .then(() => {
                        resolve();
                      })
                      .catch(e => {
                        reject(e);
                      });
                  }, 6000);
                } else {
                  // Resolve if either not in STANDBY or max attempts reached
                  resolve();
                }
              }
            });
          } else {
            resolve();
          }
        })
        .catch(e => {
          reject(e);
        });
    });
  };

  const handleLocalStream = item => {
    const isPS5 = item.apName === 'PS5';

    setLoading(true);
    setLoadingText(t('FindConsole'));
    // Find local console
    discoverDevices(isPS5)
      .then(results => {
        if (results.length) {
          results.forEach(res => {
            if (
              res.id === item.consoleId ||
              res.address.address === item.host
            ) {
              // Update console host
              item.host = res.address.address;
              if (res.status === 'STANDBY') {
                setLoadingText(t('Waking'));
                // Send wake packet
                const credential = RegistryManager.getCredential(
                  item.rpRegistKey,
                );
                if (!credential) {
                  ToastAndroid.show(t('CredentialIsEmpty'), ToastAndroid.SHORT);
                  return;
                }
                wakeup(item.host, credential);

                checkConsoleWake(isPS5, item)
                  .then(() => {
                    setTimeout(() => {
                      handleToLocalStream(item);
                    }, 10 * 1000);
                  })
                  .catch(e => {
                    handleToLocalStream(item);
                  });
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
        } else {
          Alert.alert(t('Warning'), t('ConSoleNotFound'), [
            {
              text: t('Confirm'),
              style: 'default',
            },
          ]);
          setLoading(false);
        }
      })
      .catch(e => {
        ToastAndroid.show(e, ToastAndroid.LONG);
        setLoading(false);
      });
  };

  const handleToLocalStream = item => {
    const settings = getSettings();
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
    setCurrentConsole(item);
    setShowRemoteModal(true);
    setRemoteHost(item.remoteHost || '');
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
    const settings = getSettings();
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
    log.info('handleWakeAndToStream', host, credential);
    const settings = getSettings();
    const hasValidUsbDevice = UsbRumbleManager.getHasValidUsbDevice();
    const isUsbMode = settings.bind_usb_device && hasValidUsbDevice;

    wakeup(host, credential);

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
    }, 60 * 1000);
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
            <TextInput
              label={t('RemoteHost')}
              value={remoteHost}
              style={styles.textCenter}
              onChangeText={text => setRemoteHost(text.trim())}
            />
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
});

export default HomeScreen;
