import React from 'react';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {WebView} from 'react-native-webview';
import {debugFactory} from '../utils/debug';
import {CONTROLLERS} from '../common/controller';

const log = debugFactory('DStest');

const eventEmitter = new NativeEventEmitter();
const {UsbRumbleManager} = NativeModules;

function GameMap({navigation, route}) {
  const webviewRef = React.useRef(null);
  const usbGpEventListener = React.useRef(undefined);

  const uri = 'file:///android_asset/web/index.html';

  React.useEffect(() => {
    log.info('Gamemap screen show');

    usbGpEventListener.current = eventEmitter.addListener(
      'onDsGamepadReport',
      states => {
        // console.log('states:', states);
        const {flags} = states;
        const _buttonStates = {
          CROSS: false,
          MOON: false,
          BOX: false,
          PYRAMID: false,
          DPAD_LEFT: false,
          DPAD_RIGHT: false,
          DPAD_UP: false,
          DPAD_DOWN: false,
          L1: false,
          R1: false,
          L3: false,
          R3: false,
          OPTIONS: false,
          SHARE: false,
          TOUCHPAD: false,
          PS: false,
          MUTE: false,
        };
        for (const [buttonName, buttonFlag] of Object.entries(CONTROLLERS)) {
          // eslint-disable-next-line no-bitwise
          _buttonStates[buttonName] = (flags & buttonFlag) !== 0;
        }
        const _states = {
          axes: {
            leftStickX: states.leftStickX,
            leftStickY: states.leftStickY,
            rightStickX: states.rightStickX,
            rightStickY: states.rightStickY,
            l2: states.leftTrigger,
            r2: states.rightTrigger,
            accelX: states.accelx,
            accelY: states.accely,
            accelZ: states.accelz,
            gyroX: states.gyrox,
            gyroY: states.gyroy,
            gyroZ: states.gyroz,
          },
          buttons: {
            triangle: _buttonStates.PYRAMID,
            circle: _buttonStates.MOON,
            cross: _buttonStates.CROSS,
            square: _buttonStates.BOX,
            dPadUp: _buttonStates.DPAD_UP,
            dPadRight: _buttonStates.DPAD_RIGHT,
            dPadDown: _buttonStates.DPAD_DOWN,
            dPadLeft: _buttonStates.DPAD_LEFT,
            l1: _buttonStates.L1,
            l2: states.leftTrigger > 0,
            l3: _buttonStates.L3,
            r1: _buttonStates.R1,
            r2: states.rightTrigger > 0,
            r3: _buttonStates.R3,
            options: _buttonStates.OPTIONS,
            create: _buttonStates.SHARE,
            playStation: _buttonStates.PS,
            touchPadClick: _buttonStates.TOUCHPAD,
            mute: _buttonStates.MUTE,
          },
          touchpad: {
            touches: [
              {
                touchId: states.touch0id,
                x: states.touch0x,
                y: states.touch0y,
              },
              {
                touchId: states.touch1id,
                x: states.touch1x,
                y: states.touch1y,
              },
            ],
          },
        };
        postData2Webview('gpStates', _states);
      },
    );

    return () => {
      usbGpEventListener.current && usbGpEventListener.current.remove();
    };
  }, [navigation]);

  const postData2Webview = (type, value) => {
    webviewRef.current &&
      webviewRef.current.postMessage(JSON.stringify({type, value}));
  };

  const handleWebviewMessage = event => {
    const data = JSON.parse(event.nativeEvent.data);
    let {type, message} = data;
    // console.log('dstest receive date:', type, message);
    if (type === 'dsOutput') {
      message = JSON.parse(message);

      const {
        lightbar,
        micLight,
        playerLight,
        playerLightBrightness,
        motorLeft,
        motorRight,
        leftTriggerEffect,
        leftTriggerEffectData,
        rightTriggerEffect,
        rightTriggerEffectData,
      } = message;

      let plight = 0;
      switch (playerLight) {
        case 1:
          plight = 4;
          break;
        case 2:
          plight = 10;
          break;
        case 3:
          plight = 21;
          break;
        case 4:
          plight = 27;
          break;
        case 5:
          plight = 31;
          break;
        default:
          plight = 0;
          break;
      }

      let leftEffectMode = 0;
      let rightEffectMode = 0;

      switch (leftTriggerEffect) {
        case 1:
          leftEffectMode = 1;
          break;
        case 2:
          leftEffectMode = 2;
          break;
        case 3:
          leftEffectMode = 6;
          break;
        default:
          leftEffectMode = 0;
          break;
      }

      switch (rightTriggerEffect) {
        case 1:
          rightEffectMode = 1;
          break;
        case 2:
          rightEffectMode = 2;
          break;
        case 3:
          rightEffectMode = 6;
          break;
        default:
          rightEffectMode = 0;
          break;
      }

      UsbRumbleManager.setDsController(
        lightbar[0],
        lightbar[1],
        lightbar[2],
        micLight ? 1 : 0,
        plight,
        playerLightBrightness,
        motorLeft,
        motorRight,
        leftEffectMode,
        leftTriggerEffectData,
        rightEffectMode,
        rightTriggerEffectData,
      );
    }
  };

  return (
    <>
      <WebView
        ref={webviewRef}
        source={{uri}}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        onMessage={event => {
          handleWebviewMessage(event);
        }}
      />
    </>
  );
}

export default GameMap;
