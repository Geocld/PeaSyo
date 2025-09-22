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
import {
  Card,
  List,
  Text,
  IconButton,
  Button,
  TextInput,
  HelperText,
} from 'react-native-paper';
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
const HOLEPUNCHFINISHED = 'holepunchFinished';
const PINREQUEST = 'pinRequest';
const DSCONTROLLER_NAME = 'DualSenseController';

const {
  FullScreenManager,
  GamepadManager,
  UsbRumbleManager,
  SensorModule,
  GamepadSensorModule,
} = NativeModules;

const eventEmitter = new NativeEventEmitter();

const log = debugFactory('StreamScreen');

function hexToRgb(hex: string): [number, number, number] {
  const hexCode = hex.replace(/^#/, '');
  const r = Number.parseInt(hexCode.substring(0, 2), 16);
  const g = Number.parseInt(hexCode.substring(2, 4), 16);
  const b = Number.parseInt(hexCode.substring(4, 6), 16);
  return [r, g, b];
}

// Record for hold buttons
const gpState = {
  CROSS: false,
  MOON: false,
  BOX: false,
  PYRAMID: false,
  L1: false,
  R1: false,
  LeftTrigger: false,
  RightTrigger: false,
  SHARE: false,
  OPTIONS: false,
  L3: false,
  R3: false,
  DPAD_UP: false,
  DPAD_DOWN: false,
  DPAD_LEFT: false,
  DPAD_RIGHT: false,
};

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
  const [isTouchpadDual, setIsTouchpadDual] = React.useState(false);
  const [isUsbDs5, setIsUsbDs5] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [loginPin, setLoginPin] = React.useState('');
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pinIncorrect, setPinIncorrect] = React.useState(false);

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

  const sensorEventListener = React.useRef<any>(undefined);
  const isRightstickMoving = React.useRef(false);

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
    if (name === 'TOUCHPAD') {
      handleTouchpadTap(true, 1, [0, 0, -1, 0, 0, -1]);
    } else {
      const mask = CONTROLLERS[name];
      // Hold buttons
      const hold_buttons = settings.hold_buttons || [];
      if (mask) {
        if (hold_buttons.includes(name) && gpState[name] !== undefined) {
          handlePressButton(mask, !gpState[name]);
          gpState[name] = !gpState[name];
          return;
        }
        handlePressButton(mask, true);
      } else {
        if (name === 'LeftTrigger') {
          if (hold_buttons.includes(name)) {
            handleTrigger('left', gpState[name] ? 1 : 0);
            gpState[name] = !gpState[name];
            return;
          }
          handleTrigger('left', 1);
        } else if (name === 'RightTrigger') {
          if (hold_buttons.includes(name)) {
            handleTrigger('right', gpState[name] ? 1 : 0);
            gpState[name] = !gpState[name];
            return;
          }
          handleTrigger('right', 1);
        }
      }
    }
  };

  const handlePressOut = (name: string) => {
    // console.log('handlePressOut:', name);
    setTimeout(() => {
      const hold_buttons = settings.hold_buttons || [];
      if (hold_buttons.includes(name)) {
        return;
      }

      if (name === 'TOUCHPAD') {
        handleTouchpadTap(false, 1, [0, 0, -1, 0, 0, -1]);
      } else {
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
      }
    }, 16);
  };

  const handleStickMove = (name: string, data: any) => {
    // console.log('handleStickMove:', name, data);
    const leveledX = data.x;
    const leveledY = data.y;

    const x = Number(leveledX);
    const y = Number(leveledY);

    if (name === 'right') {
      if (Math.abs(leveledX) > 0.1 || Math.abs(leveledY) > 0.1) {
        isRightstickMoving.current = true;
      } else {
        isRightstickMoving.current = false;
      }
    }

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
    // console.log('handleTouch touches:', touches);
    streamViewRef.current?.touch(mask, nextId, touches);
  };

  React.useEffect(() => {
    const _consoleInfo = route.params?.consoleInfo || null;

    const usbController = UsbRumbleManager.getUsbController();

    if (usbController === DSCONTROLLER_NAME && route.params?.isUsbMode) {
      setIsUsbDs5(true);
    }

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

    let remote_width = 1280;
    let remote_height = 720;

    let {
      resolution: _resolution,
      codec,
      fps,
      bitrate_mode,
      bitrate,
      remote_resolution: remote_resolution,
      remote_codec,
      remote_fps,
      remote_bitrate_mode,
      remote_bitrate,
      rumble,
      rumble_intensity,
      video_format,
      sensor,
      sensor_invert,
      gyroscope_type,
      dead_zone,
      edge_compensation,
      short_trigger,
      gamepad_maping,
      useSurface,
      touchpad_type,
      swap_dpad,
      log_verbose,
      haptic_stable_threshold,
      haptic_change_threshold,
      haptic_diff_threshold,
    } = _settings;

    // local
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

    // remote
    if (remote_resolution === 360) {
      remote_width = 640;
      remote_height = 360;
      if (remote_bitrate_mode === 'auto') {
        remote_bitrate = 2000;
      }
    } else if (remote_resolution === 540) {
      remote_width = 960;
      remote_height = 540;
      if (remote_bitrate_mode === 'auto') {
        remote_bitrate = 6000;
      }
    } else if (remote_resolution === 720) {
      remote_width = 1280;
      remote_height = 720;
      if (remote_bitrate_mode === 'auto') {
        remote_bitrate = 10000;
      }
    } else if (remote_resolution === 1080) {
      remote_width = 1920;
      remote_height = 1080;
      if (remote_bitrate_mode === 'auto') {
        remote_bitrate = 27000; // 27000kbps
      }
    }

    let isRemote = route.params?.isRemote || !!_consoleInfo.accessToken;

    if (!_consoleInfo.accessToken && route.params?.isRemote) {
      if (_consoleInfo.remoteHost) {
        if (
          _consoleInfo.remoteHost.startsWith('192.') ||
          _consoleInfo.remoteHost.startsWith('172.')
        ) {
          isRemote = false;
        }
      }
    }

    if (isRemote) {
      setResolution(`${remote_width} X ${remote_height}`);
    } else {
      setResolution(`${width} x ${height}`);
    }
    const _isTouchpadFull = touchpad_type === 1;
    const _isTouchpadDual = touchpad_type === 2;
    setIsTouchpadFull(_isTouchpadFull);
    setIsTouchpadDual(_isTouchpadDual);

    const _streamInfo = {
      ps5: _consoleInfo.apName.indexOf('PS5') > -1,
      host: route.params?.isRemote
        ? _consoleInfo.remoteHost
        : _consoleInfo.host,
      parsedHost: _consoleInfo.parsedHost || '',
      registKey: _consoleInfo.rpRegistKey,
      morning: _consoleInfo.rpKey,
      enableKeyboard: false,
      accessToken: _consoleInfo.accessToken || '', // 用于远程自动连接
      nickName: _consoleInfo.nickName || _consoleInfo.serverNickname || '', // 用于远程自动连接
      psnAccountId: _consoleInfo.psnAccountId || '', // 用于远程自动连接
      width: isRemote ? remote_width : width,
      height: isRemote ? remote_height : height,
      fps: isRemote ? remote_fps : fps,
      bitrate: isRemote ? remote_bitrate : bitrate,
      codec: isRemote ? remote_codec : codec,
      rumble,
      rumbleIntensity: rumble_intensity,
      usbMode: route.params?.isUsbMode || false,
      usbController,
      videoFormat: video_format,
      useSensor: sensor,
      sensorInvert: sensor_invert,
      gyroscopeType: gyroscope_type,
      deadZone: dead_zone,
      edgeCompensation: edge_compensation,
      shortTrigger: short_trigger,
      gamepadMaping: gamepad_maping,
      swapDpad: swap_dpad,
      logVerbose: log_verbose,
      hapticStableThreshold: haptic_stable_threshold,
      hapticChangeThreshold: haptic_change_threshold,
      hapticDiffThreshold: haptic_diff_threshold,
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
            if (
              _settings.show_virtual_gamead &&
              !_isTouchpadFull &&
              !_isTouchpadDual
            ) {
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
        } else if (event.type === HOLEPUNCHFINISHED) {
          setLoadingText(t('HolepunchFinished'));
        } else if (event.type === PINREQUEST) {
          setPinIncorrect(event.pinIncorrect || false);
          setShowPinModal(true);
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
        if (_settings.bind_usb_device_force_touchpad) {
          let buttonFlags = states.flags;
          // Check if Nexus button is pressed
          // eslint-disable-next-line no-bitwise
          if (buttonFlags & (1 << 15)) {
            // Remove Nexus button flag
            // eslint-disable-next-line no-bitwise
            buttonFlags &= ~(1 << 15);
            // Add TOUCHPAD button flag
            // eslint-disable-next-line no-bitwise
            buttonFlags |= 1 << 14; // BUTTON_TOUCHPAD

            states.flags = buttonFlags;
          }
        }
        // console.log('onGamepadReport:', states);
        streamViewRef.current?.usbController(states);
      },
    );

    usbDsGpEventListener.current = eventEmitter.addListener(
      'onDsGamepadReport',
      states => {
        // console.log('onDsGamepadReport:', states);
        if (_settings.bind_usb_device_force_touchpad) {
          let buttonFlags = states.flags;
          // Check if MUTE button is pressed
          // eslint-disable-next-line no-bitwise
          if (buttonFlags & (1 << 16)) {
            // Remove MUTE button flag
            // eslint-disable-next-line no-bitwise
            buttonFlags &= ~(1 << 16);
            // Add TOUCHPAD button flag
            // eslint-disable-next-line no-bitwise
            buttonFlags |= 1 << 14; // BUTTON_TOUCHPAD

            states.flags = buttonFlags;
          }
        }
        streamViewRef.current?.usbDsController(states);
      },
    );

    performanceEventListener.current = eventEmitter.addListener(
      'performance',
      states => {
        // console.log('Performance:', states);
        if (performances.current.length < 5) {
          performances.current.push(states);
        } else {
          const _avgPerformance = {
            rtt: 0,
            bitrate: 0,
            packetLoss: 0,
            decodeTime: 0,
            fps: 0,
            frameLost: 0,
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

          const avgFrameLost =
            performances.current.reduce((sum, p) => sum + p.frameLost, 0) /
            performances.current.length;

          const avgFps =
            performances.current.reduce((sum, p) => sum + p.fps, 0) /
            performances.current.length;

          _avgPerformance.rtt = avgRtt;
          _avgPerformance.bitrate = avgBitrate;
          _avgPerformance.packetLoss = avgPackLoss;
          _avgPerformance.decodeTime = avgDecodeTime;
          _avgPerformance.fps = avgFps;
          _avgPerformance.frameLost = avgFrameLost;

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
        const {right} = states;

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

    if (_settings.gyroscope) {
      const sensorManager =
        _settings.gyroscope === 2 ? GamepadSensorModule : SensorModule;
      sensorManager.startSensor(
        _settings.gyroscope_sensitivity_x,
        _settings.gyroscope_sensitivity_y,
      );

      sensorEventListener.current = eventEmitter.addListener(
        'SensorData',
        params => {
          // gyroscope only work when Rightstick not moving
          if (!isRightstickMoving.current) {
            let {x, y} = params;

            // swap x/y
            if (_settings.xy_invert) {
              x = params.y;
              y = params.x;
            }

            let stickX = x / 32767;
            let stickY = y / 32767;
            const scaleX =
              _settings.gyroscope_sensitivity_x > 10000
                ? _settings.gyroscope_sensitivity_x / 10000
                : 1;

            const scaleY =
              _settings.gyroscope_sensitivity_y > 10000
                ? _settings.gyroscope_sensitivity_y / 10000
                : 1;
            stickX = stickX * scaleX;
            stickY = stickY * scaleY;
            if (stickX > 1) {
              stickX = 1;
            }
            if (stickX < -1) {
              stickX = -1;
            }
            if (stickY > 1) {
              stickY = 1;
            }
            if (stickY < -1) {
              stickY = -1;
            }

            // Invert direction
            if (_settings.gyroscope_invert) {
              if (_settings.gyroscope_invert === 1) {
                // X axis
                stickX = -stickX;
              }
              if (_settings.gyroscope_invert === 2) {
                // Y axis
                stickY = -stickY;
              }
              if (_settings.gyroscope_invert === 3) {
                // All axis
                stickX = -stickX;
                stickY = -stickY;
              }
            }
            streamViewRef.current?.sensorStick(stickX, stickY);
          }
        },
      );
    }

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
          setShowMessageModal(true);
          setShowPinModal(true);
          setShowVirtualGamepad(true);
        }

        setLoading(true);

        // PSN connect
        if (_streamInfo.accessToken) {
          setLoadingText(t('PSNConnecting'));
        } else {
          // Normal connect
          setLoadingText(t('Connecting'));
        }
        setTimeout(() => {
          if (useSurface) {
            setConnectState('');
            setShowModal(false);
            setShowPerformance(false);
            setShowTouchpad(false);
            setShowMessageModal(false);
            setShowPinModal(false);
            setShowVirtualGamepad(false);
            setShowInitOverlay(false);
          }

          setTimeout(() => {
            streamViewRef.current?.startSession();

            // For debug without connect
            // setLoading(false);
            // setShowVirtualGamepad(true);
            // setShowTouchpad(true);
          }, 100);
        }, 300);
      }, 300);
    }, 500);

    return () => {
      Orientation.unlockAllOrientations();
      FullScreenManager.immersiveModeOff();
      stateEventListener.current && stateEventListener.current.remove();
      usbGpEventListener.current && usbGpEventListener.current.remove();
      usbDsGpEventListener.current && usbDsGpEventListener.current.remove();
      rumbleEventListener.current && rumbleEventListener.current.remove();
      triggerEventListener.current && triggerEventListener.current.remove();
      sensorEventListener.current && sensorEventListener.current.remove();
      perfTimer.current && clearInterval(perfTimer.current);
      SensorModule.stopSensor();
      GamepadSensorModule.stopSensor();
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

      if (settings.gyroscope) {
        SensorModule.stopSensor();
        GamepadSensorModule.stopSensor();
      }
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
      touchpad_type === 0
        ? styles.touchpad
        : touchpad_type === 1
        ? styles.touchpadFull
        : styles.touchpadDual;

    // Dual
    if (touchpad_type === 2) {
      return (
        <View style={touchpadStyle}>
          <View
            style={[
              styles.touchLeft,
              settings.touchpad_offset_mode === 'custom'
                ? {
                    top: `${settings.touchpad_offset}%`,
                  }
                : {},
            ]}>
            <Touchpad
              isPS5={consoleInfo.apName.indexOf('PS5') > -1}
              isDual={true}
              scale={settings.touchpad_scale}
              onTap={handleTouchpadTap}
              onTouch={handleTouch}
            />
          </View>
          <View
            style={[
              styles.touchRight,
              settings.touchpad_offset_mode === 'custom'
                ? {
                    top: `${settings.touchpad_offset}%`,
                  }
                : {},
            ]}>
            <Touchpad
              isPS5={consoleInfo.apName.indexOf('PS5') > -1}
              isDual={true}
              scale={settings.touchpad_scale}
              onTap={handleTouchpadTap}
              onTouch={handleTouch}
            />
          </View>
        </View>
      );
    } else {
      return (
        <View
          style={[
            touchpadStyle,
            settings.touchpad_offset_mode === 'custom' && !isTouchpadFull
              ? {top: `${settings.touchpad_offset}%`}
              : {},
          ]}>
          <Touchpad
            isPS5={consoleInfo.apName.indexOf('PS5') > -1}
            isFull={isTouchpadFull}
            scale={settings.touchpad_scale}
            onTap={handleTouchpadTap}
            onTouch={handleTouch}
          />
        </View>
      );
    }
  };

  const handleSendMessage = () => {
    streamViewRef.current?.sendText(message);
    setShowMessageModal(false);
  };

  const handleSwitchKeyboard = (isReject: boolean) => {
    streamViewRef.current?.switchKb(isReject);
    setShowMessageModal(false);
  };

  const handleSendLoginPin = () => {
    if (!loginPin) {
      return;
    }
    streamViewRef.current?.setLoginPin(loginPin);
    setShowPinModal(false);
  };

  const handleExitLoginPin = () => {
    setShowPinModal(false);
    handleExit();
  };

  const renderMessageModal = () => {
    if (!showMessageModal || !consoleInfo) {
      return null;
    }

    return (
      <View style={styles.messageModal}>
        <Card>
          <Card.Content>
            <TextInput
              label={t('Text')}
              value={message}
              onChangeText={text => setMessage(text)}
            />
            <Button
              mode="contained"
              style={{marginTop: 10}}
              onPress={handleSendMessage}>
              {t('Send')}
            </Button>

            <Button
              mode="outlined"
              style={{marginTop: 10}}
              onPress={() => handleSwitchKeyboard(true)}>
              {t('ExitRemoteKb')}
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderPinModal = () => {
    if (!showPinModal) {
      return null;
    }

    return (
      <View style={styles.messageModal}>
        <Card>
          <Card.Content>
            <TextInput
              label={t('Login PIN')}
              value={loginPin}
              onChangeText={text => setLoginPin(text)}
            />
            <HelperText type="error" visible={pinIncorrect}>
              {t('Login PIN incorrect')}
            </HelperText>
            <Button
              mode="contained"
              style={{marginTop: 10}}
              onPress={handleSendLoginPin}>
              {t('Confirm')}
            </Button>

            <Button
              mode="contained"
              style={{marginTop: 10}}
              onPress={handleExitLoginPin}>
              {t('Exit')}
            </Button>
          </Card.Content>
        </Card>
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

      {renderMessageModal()}

      {renderPinModal()}

      {settings.show_menu && (
        <View style={styles.quickMenu}>
          <IconButton
            icon="menu"
            size={28}
            onPress={() => {
              setShowModal(true);
            }}
          />
        </View>
      )}

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
                  {connectState === CONNECTED &&
                    !isTouchpadFull &&
                    !isTouchpadDual &&
                    !isUsbDs5 && (
                      <List.Item
                        title={t('Toggle Virtual Gamepad')}
                        background={background}
                        onPress={() => {
                          setShowVirtualGamepad(!showVirtualGamepad);
                          handleCloseModal();
                        }}
                      />
                    )}
                  {connectState === CONNECTED && !isUsbDs5 && (
                    <List.Item
                      title={t('Toggle Touchpad')}
                      background={background}
                      onPress={() => {
                        setShowTouchpad(!showTouchpad);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {connectState === CONNECTED && !isUsbDs5 && (
                    <List.Item
                      title={t('Long Press PS')}
                      background={background}
                      onPress={() => {
                        handlePressIn('PS');
                        setTimeout(() => handlePressOut('PS'), 2000);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {connectState === CONNECTED && !isUsbDs5 && (
                    <List.Item
                      title={t('Press PS')}
                      background={background}
                      onPress={() => {
                        handlePressIn('PS');
                        setTimeout(() => handlePressOut('PS'), 350);
                        handleCloseModal();
                      }}
                    />
                  )}
                  {/* {connectState === CONNECTED && settings.keyboard && (
                    <List.Item
                      title={t('Send text')}
                      background={background}
                      onPress={() => {
                        handleCloseModal();
                        setShowMessageModal(true);
                      }}
                    />
                  )} */}
                  {connectState === CONNECTED && (
                    <List.Item
                      title={t('Disconnect and sleep')}
                      background={background}
                      onPress={() => {
                        streamViewRef.current?.sleep();
                        handleCloseModal();
                        setTimeout(() => {
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
  messageModal: {
    position: 'absolute',
    top: '2%',
    left: 0,
    marginLeft: '25%',
    marginRight: '25%',
    zIndex: 998,
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
  touchpadDual: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  touchLeft: {
    position: 'absolute',
    left: 0,
  },
  touchRight: {
    position: 'absolute',
    right: 0,
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
  quickMenu: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    zIndex: 10,
    opacity: 0.6,
  },
});

export default StreamScreen;
