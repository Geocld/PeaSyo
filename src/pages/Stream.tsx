import React from 'react';
import {
  Alert,
  StyleSheet,
  View,
  ScrollView,
  AppState,
  ToastAndroid,
  Dimensions,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import {Card, List, Text} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Spinner from '../components/Spinner';
import Orientation from 'react-native-orientation-locker';
import StreamView from '../components/StreamView';
import StreamTextureView from '../components/StreamTextureView';
import {CONTROLLERS} from '../common/controller';
import VirtualGamepad from '../components/VirtualGamepad';
import CustomVirtualGamepad from '../components/CustomVirtualGamepad';
import Touchpad from '../components/Touchpad';
import PerfPanel from '../components/PerfPanel';
import {getSettings} from '../store/settingStore';
import {debugFactory} from '../utils/debug';

const CONNECTED = 'connected';

const {FullScreenManager, GamepadManager, UsbRumbleManager} = NativeModules;

const eventEmitter = new NativeEventEmitter();

const log = debugFactory('StreamScreen');

function hexToRgb(hex: string): [number, number, number] {
  const hexCode = hex.replace(/^#/, '');
  const r = Number.parseInt(hexCode.substring(0, 2), 16);
  const g = Number.parseInt(hexCode.substring(2, 4), 16);
  const b = Number.parseInt(hexCode.substring(4, 6), 16);
  return [r, g, b];
}

function StreamScreen({navigation, route}) {
  const {t} = useTranslation();

  const [loading, setLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');
  const [consoleInfo, setConsoleInfo] = React.useState<any>(null);
  const [connectState, setConnectState] = React.useState('');
  const [showVirtualGamepad, setShowVirtualGamepad] = React.useState(false);
  const [showTouchpad, setShowTouchpad] = React.useState(false);
  const streamViewRef = React.useRef<any>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [modalMaxHeight, setModalMaxHeight] = React.useState(250);
  const [showStreamView, setShowStreamView] = React.useState(false);
  const [avgPerformance, setAvgPerformance] = React.useState({});
  const [showPerformance, setShowPerformance] = React.useState(false);
  const [showInitOverlay, setShowInitOverlay] = React.useState(false);
  const [settings, setSettings] = React.useState<any>({});
  const [streamInfo, setStreamInfo] = React.useState<any>(null);
  const [resolution, setResolution] = React.useState('');
  const [isTouchpadFull, setIsTouchpadFull] = React.useState(false);

  const stateEventListener = React.useRef<any>(undefined);
  const usbGpEventListener = React.useRef<any>(undefined);
  const usbDsGpEventListener = React.useRef<any>(undefined);
  const appStateSubscription = React.useRef<any>(undefined);
  const performanceEventListener = React.useRef<any>(undefined);
  const rumbleEventListener = React.useRef<any>(undefined);
  const triggerEventListener = React.useRef<any>(undefined);
  const perfTimer = React.useRef<any>(undefined);
  const performances = React.useRef<any[]>([]);
  const isExiting = React.useRef(false);

  const leftTriggerType = React.useRef(0);
  const leftTriggerData = React.useRef<any>([]);
  const rightTriggerType = React.useRef(0);
  const rightTriggerData = React.useRef<any>([]);
  const lightRGB = React.useRef<any>([223, 96, 105]); // #DF6069

  const background = {
    borderless: false,
    color: 'rgba(255, 255, 255, 0.2)',
    foreground: true,
  };

  const handlePressIn = (name: string) => {
    // console.log('handlePressIn:', name);
    const mask = CONTROLLERS[name];
    if (mask) {
      handlePressButton(mask, true);
    } else {
      if (name === 'LeftTrigger') {
        handleTrigger('left', 1);
      } else if (name === 'RightTrigger') {
        handleTrigger('right', 1);
      }
    }
  };

  const handlePressOut = (name: string) => {
    // console.log('handlePressOut:', name);
    const mask = CONTROLLERS[name];
    if (mask) {
      handlePressButton(mask, false);
    } else {
      if (name === 'LeftTrigger') {
        handleTrigger('left', 0);
      } else if (name === 'RightTrigger') {
        handleTrigger('right', 0);
      }
    }
  };

  const handleStickMove = (name: string, data: any) => {
    // console.log('handleStickMove:', name, data);
    const leveledX = data.dist.x;
    const leveledY = data.dist.y;

    const x = Number(leveledX);
    const y = Number(-leveledY);
    handleMoveStick(name, x, y);
  };

  const handlePressButton = (buttonMask: number, isPressed: boolean) => {
    streamViewRef.current?.pressButton(buttonMask, isPressed);
  };

  const handleTrigger = (name: string, value: number) => {
    streamViewRef.current?.pressTrigger(name, value);
  };

  const handleMoveStick = (name: string, x: number, y: number) => {
    streamViewRef.current?.moveStick(name, x, y);
  };

  const handleTouchpadTap = (
    isPressed: boolean,
    nextId: number,
    touches: any[],
  ) => {
    // console.log('handleTouchpadTap isPressed:', isPressed);
    if (!isPressed) {
      setTimeout(() => {
        streamViewRef.current?.tap(isPressed, nextId, touches);
      }, 150);
    } else {
      streamViewRef.current?.tap(isPressed, nextId, touches);
    }
  };

  const handleTouch = (mask: number, nextId: number, touches: any[]) => {
    // console.log('handleTouch touches:', touches)
    streamViewRef.current?.touch(mask, nextId, touches);
  };

  React.useEffect(() => {
    const _consoleInfo = route.params?.consoleInfo || null;

    const usbController = UsbRumbleManager.getUsbController();

    if (!_consoleInfo) {
      Alert.alert(t('Warning'), 'Console not found', [
        {
          text: t('Confirm'),
          style: 'default',
          onPress: () => {
            navigation.navigate('Home');
          },
        },
      ]);
      return;
    }

    setConsoleInfo(_consoleInfo);

    const _settings = getSettings();
    setSettings(_settings);

    log.info('consoleInfo:', _consoleInfo);
    log.info('_settings:', _settings);

    if (_settings.rgb) {
      const [r, g, b] = hexToRgb(_settings.rgb);
      lightRGB.current = [r, g, b];
    }

    let width = 1280;
    let height = 720;

    let {
      resolution: _resolution,
      codec,
      fps,
      bitrate_mode,
      bitrate,
      rumble,
      rumble_intensity,
      video_format,
      sensor,
      sensor_invert,
      dead_zone,
      edge_compensation,
      short_trigger,
      gamepad_maping,
      useSurface,
      touchpad_type,
    } = _settings;
    if (_resolution === 360) {
      width = 640;
      height = 360;
      if (bitrate_mode === 'auto') {
        bitrate = 2000;
      }
    } else if (_resolution === 540) {
      width = 960;
      height = 540;
      if (bitrate_mode === 'auto') {
        bitrate = 6000;
      }
    } else if (_resolution === 720) {
      width = 1280;
      height = 720;
      if (bitrate_mode === 'auto') {
        bitrate = 10000;
      }
    } else if (_resolution === 1080) {
      width = 1920;
      height = 1080;
      if (bitrate_mode === 'auto') {
        bitrate = 27000; // 27000kbps
      }
    }

    setResolution(`${width} x ${height}`);
    const _isTouchpadFull = touchpad_type === 1;
    setIsTouchpadFull(_isTouchpadFull);

    const _streamInfo = {
      ps5: _consoleInfo.apName.indexOf('PS5') > -1,
      host: route.params?.isRemote
        ? _consoleInfo.remoteHost
        : _consoleInfo.host,
      registKey: _consoleInfo.rpRegistKey,
      morning: _consoleInfo.rpKey,
      width,
      height,
      fps,
      bitrate,
      codec,
      rumble,
      rumbleIntensity: rumble_intensity,
      usbMode: route.params?.isUsbMode || false,
      usbController,
      videoFormat: video_format,
      useSensor: sensor,
      sensorInvert: sensor_invert,
      deadZone: dead_zone,
      edgeCompensation: edge_compensation,
      shortTrigger: short_trigger,
      gamepadMaping: gamepad_maping,
    };

    log.info('_streamInfo:', _streamInfo);

    setStreamInfo(_streamInfo);

    FullScreenManager.immersiveModeOn();

    navigation.addListener('beforeRemove', e => {
      GamepadManager.vibrate(0, 0, 0, 0, 0, 3);
      if (e.data.action.type !== 'GO_BACK') {
        navigation.dispatch(e.data.action);
      } else {
        e.preventDefault();
        // Show confirm modal
        setShowModal(true);
      }
    });

    appStateSubscription.current = AppState.addEventListener(
      'change',
      state => {
        if (state === 'background') {
          // PipManager.enterPipMode();
          if (useSurface) {
            // Will exit if use surfaceView
            streamViewRef.current?.stopSession();
            GamepadManager.vibrate(0, 0, 0, 0, 0, 3);
            if (_settings.sensor) {
              streamViewRef.current?.stopSensor();
            }
            navigation.navigate({
              name: 'Home',
            });
          }
        }
      },
    );

    stateEventListener.current = eventEmitter.addListener(
      'streamStateChange',
      event => {
        setConnectState(event.type || '');
        // console.log('streamStateChange event:', event);
        if (event.type === CONNECTED) {
          log.info('connected');

          setLoading(false);
          ToastAndroid.show(t('Connected'), ToastAndroid.SHORT);

          setTimeout(() => {
            // Alway show virtual gamepad
            if (_settings.show_virtual_gamead && !_isTouchpadFull) {
              setShowVirtualGamepad(true);
            }

            // Alway show touchpad
            if (_settings.show_touchpad) {
              setShowTouchpad(true);
            }

            // Alway show performance
            if (_settings.show_performance) {
              setShowPerformance(true);
            }

            // Sensor
            if (_settings.sensor) {
              streamViewRef.current?.startSensor();
            }
          }, 100);

          // Performance
          perfTimer.current = setInterval(() => {
            streamViewRef.current?.getPerformance();
          }, 500);
        } else {
          // {"reason": "Stopped", "reasonString": null, "type": "quit"}
          if (event.reason !== 'Stopped') {
            Alert.alert(t('Warning'), `Connect fail: ${t(event.reason)}`, [
              {
                text: t('Confirm'),
                style: 'default',
                onPress: () => {
                  setLoading(true);
                  streamViewRef.current?.stopSession();
                  GamepadManager.vibrate(0, 0, 0, 0, 0, 3);
                  if (_settings.sensor) {
                    streamViewRef.current?.stopSensor();
                  }
                  setTimeout(() => {
                    navigation.navigate('Home');
                  }, 1000);
                },
              },
            ]);
          }
        }
      },
    );

    usbGpEventListener.current = eventEmitter.addListener(
      'onGamepadReport',
      states => {
        // console.log('onGamepadReport:', states);
        streamViewRef.current?.usbController(states);
      },
    );

    usbDsGpEventListener.current = eventEmitter.addListener(
      'onDsGamepadReport',
      states => {
        // console.log('onDsGamepadReport:', states);
        streamViewRef.current?.usbDsController(states);
      },
    );

    performanceEventListener.current = eventEmitter.addListener(
      'performance',
      states => {
        // console.log('Performance:', states);
        if (performances.current.length < 10) {
          performances.current.push(states);
        } else {
          const _avgPerformance = {
            rtt: 0,
            bitrate: 0,
            packetLoss: 0,
            decodeTime: 0,
            fps: 0,
          };

          const rtts = performances.current.map(p => p.rtt);
          rtts.sort((a, b) => a - b);
          const avgRtt = rtts[0];

          const avgBitrate =
            performances.current.reduce((sum, p) => sum + p.bitrate, 0) /
            performances.current.length;
          const avgPackLoss =
            performances.current.reduce((sum, p) => sum + p.packetLoss, 0) /
            performances.current.length;
          const avgDecodeTime =
            performances.current.reduce((sum, p) => sum + p.decodeTime, 0) /
            performances.current.length;

          const avgFps =
            performances.current.reduce((sum, p) => sum + p.fps, 0) /
            performances.current.length;

          _avgPerformance.rtt = avgRtt;
          _avgPerformance.bitrate = avgBitrate;
          _avgPerformance.packetLoss = avgPackLoss;
          _avgPerformance.decodeTime = avgDecodeTime;
          _avgPerformance.fps = avgFps;

          setAvgPerformance(_avgPerformance);
          performances.current = [];
        }
      },
    );

    function intToByteArray(int32) {
      const byteArray = new Array(10).fill(0);
      for (let i = 0; i < 10; i++) {
        // eslint-disable-next-line no-bitwise
        byteArray[i] = (int32 >> (i * 8)) & 0xff;
      }
      return byteArray;
    }

    rumbleEventListener.current = eventEmitter.addListener(
      'dsRumble',
      states => {
        if (!route.params?.isUsbMode) {
          return;
        }
        if (usbController !== 'DualSenseController') {
          return;
        }
        // console.log('dsRumble:', states);
        const {left, right} = states;

        UsbRumbleManager.setDsController(
          lightRGB.current[0] || 0, // r
          lightRGB.current[1] || 0, // g
          lightRGB.current[2] || 0, // b
          0,
          0,
          0,
          0,
          right * 0.5,
          leftTriggerType.current,
          leftTriggerData.current,
          rightTriggerType.current,
          rightTriggerData.current,
        );
      },
    );

    triggerEventListener.current = eventEmitter.addListener(
      'trigger',
      states => {
        if (!route.params?.isUsbMode) {
          return;
        }
        const {leftType, leftData, rightType, rightData} = states;

        const leftArr = intToByteArray(leftData);
        const rightArr = intToByteArray(rightData);

        leftTriggerType.current = leftType;
        leftTriggerData.current = leftArr;

        rightTriggerType.current = rightType;
        rightTriggerData.current = rightArr;

        UsbRumbleManager.setDsController(
          0,
          10,
          0,
          0,
          0,
          0,
          0,
          0,
          leftType,
          leftArr,
          rightType,
          rightArr,
        );
      },
    );

    setTimeout(() => {
      Orientation.lockToLandscape();

      setTimeout(() => {
        const {height: dHeight} = Dimensions.get('window');
        setModalMaxHeight(dHeight - 50);

        setShowStreamView(true);

        if (useSurface) {
          setShowInitOverlay(true);
          // Surface view preRender
          setConnectState(CONNECTED);
          setShowModal(true);
          setShowPerformance(true);
          setShowTouchpad(true);
          setShowVirtualGamepad(true);
        }

        setLoading(true);

        setLoadingText(t('Connecting'));
        setTimeout(() => {
          if (useSurface) {
            setConnectState('');
            setShowModal(false);
            setShowPerformance(false);
            setShowTouchpad(false);
            setShowVirtualGamepad(false);
            setShowInitOverlay(false);
          }

          setTimeout(() => {
            streamViewRef.current?.startSession();
          }, 100);
        }, 300);
      }, 100);
    }, 500);

    return () => {
      Orientation.unlockAllOrientations();
      FullScreenManager.immersiveModeOff();
      stateEventListener.current && stateEventListener.current.remove();
      usbGpEventListener.current && usbGpEventListener.current.remove();
      usbDsGpEventListener.current && usbDsGpEventListener.current.remove();
      rumbleEventListener.current && rumbleEventListener.current.remove();
      triggerEventListener.current && triggerEventListener.current.remove();
      perfTimer.current && clearInterval(perfTimer.current);
    };
  }, [
    navigation,
    route.params?.consoleInfo,
    route.params?.isRemote,
    route.params?.isUsbMode,
    t,
  ]);

  const handleCloseModal = () => {
    setShowModal(false);
    streamViewRef.current?.requestFocus();
  };

  const handleExit = () => {
    isExiting.current = true;
    try {
      handleDisconnect();
      handleCloseModal();
      setShowPerformance(false);
      setShowVirtualGamepad(false);
      setShowTouchpad(false);
      setShowTouchpad(false);
    } catch (e) {}
    setTimeout(() => {
      GamepadManager.vibrate(0, 0, 0, 0, 0, 3);
      navigation.navigate({
        name: 'Home',
      });
    }, 1000);
  };

  const handleDisconnect = () => {
    streamViewRef.current?.stopSession();
    if (settings.sensor) {
      streamViewRef.current?.stopSensor();
    }
  };

  const renderStreamView = () => {
    if (!streamInfo || !showStreamView) {
      return null;
    }
    if (settings.useSurface) {
      return (
        <StreamView
          style={styles.sv}
          ref={streamViewRef}
          streamInfo={streamInfo}
        />
      );
    } else {
      return (
        <StreamTextureView
          style={styles.sv}
          ref={streamViewRef}
          streamInfo={streamInfo}
        />
      );
    }
  };

  const renderVirtualGamepad = () => {
    if (!showVirtualGamepad) {
      return null;
    }
    const useCustomVirtualGamepad = settings.custom_virtual_gamepad !== '';
    if (useCustomVirtualGamepad) {
      return (
        <CustomVirtualGamepad
          title={settings.custom_virtual_gamepad}
          opacity={settings.virtual_gamepad_opacity}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onStickMove={handleStickMove}
        />
      );
    } else {
      return (
        <VirtualGamepad
          opacity={settings.virtual_gamepad_opacity}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onStickMove={handleStickMove}
        />
      );
    }
  };

  const renderTouchpad = () => {
    if (!showTouchpad || !consoleInfo) {
      return null;
    }
    const {touchpad_type} = settings;
    const touchpadStyle =
      touchpad_type === 0 ? styles.touchpad : styles.touchpadFull;

    return (
      <View style={touchpadStyle}>
        <Touchpad
          isPS5={consoleInfo.apName.indexOf('PS5') > -1}
          isFull={isTouchpadFull}
          onTap={handleTouchpadTap}
          onTouch={handleTouch}
        />
      </View>
    );
  };

  return (
    <View>
      {showInitOverlay && (
        <View style={styles.initOverlay}>
          <Text style={{color: '#DF6069', fontSize: 16}}>
            {t('SurfaceRenderDesc')}
          </Text>
        </View>
      )}

      {loading && <Spinner text={loadingText} />}

      {showPerformance && (
        <PerfPanel resolution={resolution} performance={avgPerformance} />
      )}

      {renderVirtualGamepad()}

      {renderTouchpad()}

      {showModal && (
        <View style={styles.modal}>
          <Card>
            <Card.Content>
              <ScrollView style={{maxHeight: modalMaxHeight}}>
                <List.Section>
                  {connectState === CONNECTED && (
                    <List.Item
                      title={t('Toggle Performance')}
                      background={background}
                      onPress={() => {
                        setShowPerformance(!showPerformance);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {connectState === CONNECTED && !isTouchpadFull && (
                    <List.Item
                      title={t('Toggle Virtual Gamepad')}
                      background={background}
                      onPress={() => {
                        setShowVirtualGamepad(!showVirtualGamepad);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {connectState === CONNECTED && (
                    <List.Item
                      title={t('Toggle Touchpad')}
                      background={background}
                      onPress={() => {
                        setShowTouchpad(!showTouchpad);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {connectState === CONNECTED && (
                    <List.Item
                      title={t('Press PS')}
                      background={background}
                      onPress={() => {
                        handlePressIn('PS');
                        setTimeout(() => handlePressOut('PS'), 200);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {connectState === CONNECTED && (
                    <List.Item
                      title={t('Disconnect and sleep')}
                      background={background}
                      onPress={() => {
                        streamViewRef.current?.sleep();
                        setTimeout(() => {
                          handleCloseModal();
                          handleExit();
                        }, 1000);
                      }}
                    />
                  )}
                  <List.Item
                    title={t('Disconnect')}
                    background={background}
                    onPress={() => {
                      handleExit();
                    }}
                  />
                  <List.Item
                    title={t('Cancel')}
                    background={background}
                    onPress={() => handleCloseModal()}
                  />
                </List.Section>
              </ScrollView>
            </Card.Content>
          </Card>
        </View>
      )}

      <View style={styles.svWrap}>{renderStreamView()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  svWrap: {
    alignItems: 'center',
  },
  sv: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  buttonsWrap: {
    marginTop: 30,
  },
  button: {
    marginBottom: 10,
  },
  card: {
    width: 300,
    padding: 5,
  },
  modal: {
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: '5%',
    left: 0,
    marginLeft: '32%',
    marginRight: '32%',
    zIndex: 999,
  },
  touchpad: {
    position: 'absolute',
    top: 10,
    left: '25%',
    right: '25%',
    zIndex: 99,
    alignItems: 'center',
  },
  touchpadFull: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    alignItems: 'center',
  },
  initOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'black',
  },
});

export default StreamScreen;
