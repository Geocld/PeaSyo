import React from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import {Button, Text, Divider, Switch, RadioButton} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Slider from '@react-native-community/slider';
import ColorPicker from 'react-native-wheel-color-picker';

import DS5Controller from '../components/DS5Controller';
import {CONTROLLERS} from '../common/controller';

const eventEmitter = new NativeEventEmitter();
const ACTIVITY = '#DF6069';
const NORMAL = '#ccc';
const MAX_RANGE = 1000;

const {UsbRumbleManager} = NativeModules;

function hexToRgb(hex: string): [number, number, number] {
  const hexCode = hex.replace(/^#/, '');
  const r = Number.parseInt(hexCode.substring(0, 2), 16);
  const g = Number.parseInt(hexCode.substring(2, 4), 16);
  const b = Number.parseInt(hexCode.substring(4, 6), 16);
  return [r, g, b];
}

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function (...args) {
    if (!lastRan) {
      // @ts-ignore
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          // @ts-ignore
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

function DsScreen({navigation}) {
  const {t} = useTranslation();
  const [cross, setCross] = React.useState(0);
  const [moon, setMoon] = React.useState(0);
  const [box, setBox] = React.useState(0);
  const [pyramid, setPyramid] = React.useState(0);
  const [left, setLeft] = React.useState(0);
  const [right, setRight] = React.useState(0);
  const [up, setUp] = React.useState(0);
  const [down, setDown] = React.useState(0);
  const [l1, setL1] = React.useState(0);
  const [r1, setR1] = React.useState(0);
  const [l3, setL3] = React.useState(0);
  const [r3, setR3] = React.useState(0);
  const [options, setOptions] = React.useState(0);
  const [share, setShare] = React.useState(0);
  const [touchpad, setTouchpad] = React.useState(0);
  const [ps, setPs] = React.useState(0);
  const [mute, setMute] = React.useState(0);
  const [leftTrigger, setLeftTrigger] = React.useState(0);
  const [rightTrigger, setRightTrigger] = React.useState(0);
  const [leftStickX, setLeftStickX] = React.useState(0);
  const [leftStickY, setLeftStickY] = React.useState(0);
  const [rightStickX, setRightStickX] = React.useState(0);
  const [rightStickY, setRightStickY] = React.useState(0);
  const [gyrox, setGyrox] = React.useState(0);
  const [gyroy, setGyroy] = React.useState(0);
  const [gyroz, setGyroz] = React.useState(0);
  const [accelx, setAccelx] = React.useState(0);
  const [accely, setAccely] = React.useState(0);
  const [accelz, setAccelz] = React.useState(0);
  const [touch0active, setTouch0active] = React.useState(false);
  const [touch0id, setTouch0id] = React.useState(0);
  const [touch0x, setTouch0x] = React.useState(0);
  const [touch0y, setTouch0y] = React.useState(0);
  const [touch1active, setTouch1active] = React.useState(false);
  const [touch1id, setTouch1id] = React.useState(0);
  const [touch1x, setTouch1x] = React.useState(0);
  const [touch1y, setTouch1y] = React.useState(0);

  const usbGpEventListener = React.useRef<any>(undefined);

  const [microLed, setMicroLed] = React.useState('0');
  const microLedRef = React.useRef<any>('0');

  const [playerLed, setPlayerLed] = React.useState('0');
  const [playerLight, setPlayerLight] = React.useState('0');
  const [currentColor, setCurrentColor] = React.useState('#DF6069');
  const colorPickerRef = React.useRef<any>(null);

  React.useEffect(() => {
    const handleGamepadReport = throttle(states => {
      // console.log('onDsGamepadReport:', states);
      const {flags} = states;
      const _buttonStates = {
        CROSS: 0,
        MOON: 0,
        BOX: 0,
        PYRAMID: 0,
        DPAD_LEFT: 0,
        DPAD_RIGHT: 0,
        DPAD_UP: 0,
        DPAD_DOWN: 0,
        L1: 0,
        R1: 0,
        L3: 0,
        R3: 0,
        OPTIONS: 0,
        SHARE: 0,
        TOUCHPAD: 0,
        PS: 0,
        MUTE: 0,
      };
      for (const [buttonName, buttonFlag] of Object.entries(CONTROLLERS)) {
        // eslint-disable-next-line no-bitwise
        _buttonStates[buttonName] = (flags & buttonFlag) !== 0 ? 1 : 0;
      }

      setCross(_buttonStates.CROSS);
      setMoon(_buttonStates.MOON);
      setBox(_buttonStates.BOX);
      setPyramid(_buttonStates.PYRAMID);
      setLeft(_buttonStates.DPAD_LEFT);
      setRight(_buttonStates.DPAD_RIGHT);
      setUp(_buttonStates.DPAD_UP);
      setDown(_buttonStates.DPAD_DOWN);
      setL1(_buttonStates.L1);
      setR1(_buttonStates.R1);
      setL3(_buttonStates.L3);
      setR3(_buttonStates.R3);
      setOptions(_buttonStates.OPTIONS);
      setShare(_buttonStates.SHARE);
      setTouchpad(_buttonStates.TOUCHPAD);
      setPs(_buttonStates.PS);
      setMute(_buttonStates.MUTE);
      setLeftTrigger(states.leftTrigger);
      setRightTrigger(states.rightTrigger);
      setLeftStickX(states.leftStickX);
      setLeftStickY(states.leftStickY);
      setRightStickX(states.rightStickX);
      setRightStickY(states.rightStickY);
      setGyrox(states.gyrox);
      setGyroy(states.gyroy);
      setGyroz(states.gyroz);
      setAccelx(states.accelx);
      setAccely(states.accely);
      setAccelz(states.accelz);
      setTouch0active(states.touch0active);
      setTouch0id(states.touch0id);
      setTouch0x(states.touch0x);
      setTouch0y(states.touch0y);
      setTouch1active(states.touch1active);
      setTouch1id(states.touch1id);
      setTouch1x(states.touch1x);
      setTouch1y(states.touch1y);
    }, 32);
    usbGpEventListener.current = eventEmitter.addListener(
      'onDsGamepadReport',
      handleGamepadReport,
    );

    return () => {
      usbGpEventListener.current && usbGpEventListener.current.remove();
    };
  }, [navigation, t]);

  const getCenterPointPos = (value: number) => {
    return (value / MAX_RANGE) * 100;
  };

  const handleMicroLed = value => {
    setMicroLed(value);
    microLedRef.current = value;
    handleSetController();
  };

  const handleColorChangeComplete = color => {
    setCurrentColor(color);
    setTimeout(() => {
      handleSetController();
    }, 10);
  };

  const handleSetController = () => {
    const [r, g, b] = hexToRgb(currentColor);
    UsbRumbleManager.setDsController(
      r,
      g,
      b,
      microLedRef.current === '1' ? 1 : 0,
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View>
        <DS5Controller
          cross={cross}
          moon={moon}
          box={box}
          pyramid={pyramid}
          left={left}
          right={right}
          up={up}
          down={down}
          l1={l1}
          r1={r1}
          l3={l3}
          r3={r3}
          options={options}
          share={share}
          touchpad={touchpad}
          touch0active={touch0active}
          touch1active={touch1active}
          ps={ps}
          mute={mute}
          leftTrigger={leftTrigger}
          rightTrigger={rightTrigger}
        />
      </View>

      <View style={styles.statesWrap}>
        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: up > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">UP</Text>
              <Text variant="bodyLarge">{up}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: down > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">DOWN</Text>
              <Text variant="bodyLarge">{down}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: left > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">LEFT</Text>
              <Text variant="bodyLarge">{left}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: right > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">RIGHT</Text>
              <Text variant="bodyLarge">{right}</Text>
            </View>
          </View>
        </View>

        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: cross > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">CROSS</Text>
              <Text variant="bodyLarge">{cross}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: moon > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">MOON</Text>
              <Text variant="bodyLarge">{moon}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: box > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">BOX</Text>
              <Text variant="bodyLarge">{box}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: pyramid > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">PYRAMID</Text>
              <Text variant="bodyLarge">{pyramid}</Text>
            </View>
          </View>
        </View>

        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: l1 > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">L1</Text>
              <Text variant="bodyLarge">{l1}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: r1 > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">R1</Text>
              <Text variant="bodyLarge">{r1}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: leftTrigger > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">L2</Text>
              <Text variant="bodyLarge">{leftTrigger.toFixed(4)}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: rightTrigger > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">R2</Text>
              <Text variant="bodyLarge">{rightTrigger.toFixed(4)}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: l3 > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">L3</Text>
              <Text variant="bodyLarge">{l3}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: r3 > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">R3</Text>
              <Text variant="bodyLarge">{r3}</Text>
            </View>
          </View>
        </View>

        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: options > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">OPTIONS</Text>
              <Text variant="bodyLarge">{options}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: share > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">SHARE</Text>
              <Text variant="bodyLarge">{share}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: touchpad > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">TOUCHPAD</Text>
              <Text variant="bodyLarge">{touchpad}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: ps > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">PS</Text>
              <Text variant="bodyLarge">{ps}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: mute > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">MUTE</Text>
              <Text variant="bodyLarge">{mute}</Text>
            </View>
          </View>
        </View>

        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: leftStickX !== 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">LEFT X</Text>
              <Text variant="bodyLarge">{leftStickX.toFixed(4)}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: leftStickY !== 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">LEFT Y</Text>
              <Text variant="bodyLarge">{leftStickY.toFixed(4)}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: rightStickX !== 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">RIGHT X</Text>
              <Text variant="bodyLarge">{rightStickX.toFixed(4)}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: rightStickY !== 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">RIGHT Y</Text>
              <Text variant="bodyLarge">{rightStickY.toFixed(4)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stateItem}>
          <View
            style={[
              styles.stateLeft,
              {backgroundColor: touch0active ? ACTIVITY : NORMAL},
            ]}
          />
          <View style={styles.stateRight}>
            <Text variant="bodySmall">Touchpoint0 activity</Text>
            <Text variant="bodyLarge">{touch0active ? 1 : 0}</Text>
          </View>
        </View>

        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {
                  backgroundColor:
                    touch0id > 0 && touch0active ? ACTIVITY : NORMAL,
                },
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">Touchpoint0 ID</Text>
              <Text variant="bodyLarge">{touch0id}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {
                  backgroundColor:
                    touch0x > 0 && touch0active ? ACTIVITY : NORMAL,
                },
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">Touchpoint0 X</Text>
              <Text variant="bodyLarge">{touch0x}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {backgroundColor: touch0y > 0 ? ACTIVITY : NORMAL},
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">Touchpoint0 Y</Text>
              <Text variant="bodyLarge">{touch0y}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stateItem}>
          <View
            style={[
              styles.stateLeft,
              {
                backgroundColor: touch1active ? ACTIVITY : NORMAL,
              },
            ]}
          />
          <View style={styles.stateRight}>
            <Text variant="bodySmall">Touchpoint1 activity</Text>
            <Text variant="bodyLarge">{touch1active ? 1 : 0}</Text>
          </View>
        </View>

        <View style={styles.states}>
          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {
                  backgroundColor:
                    touch1id > 0 && touch1active ? ACTIVITY : NORMAL,
                },
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">Touchpoint1 ID</Text>
              <Text variant="bodyLarge">{touch1id}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {
                  backgroundColor:
                    touch1x > 0 && touch1active ? ACTIVITY : NORMAL,
                },
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">Touchpoint1 X</Text>
              <Text variant="bodyLarge">{touch1x}</Text>
            </View>
          </View>

          <View style={styles.stateItem}>
            <View
              style={[
                styles.stateLeft,
                {
                  backgroundColor:
                    touch1y > 0 && touch1active ? ACTIVITY : NORMAL,
                },
              ]}
            />
            <View style={styles.stateRight}>
              <Text variant="bodySmall">Touchpoint1 Y</Text>
              <Text variant="bodyLarge">{touch1y}</Text>
            </View>
          </View>
        </View>

        <Divider />

        <View>
          <Text>陀螺仪</Text>

          <Text>俯仰角: {(gyrox / 10).toFixed(1)}°/S</Text>
          <Slider
            style={styles.slider}
            disabled
            value={getCenterPointPos(gyrox)}
            minimumValue={-100}
            maximumValue={100}
            step={0.1}
            minimumTrackTintColor="#DF6069"
            maximumTrackTintColor="grey"
          />

          <Text>偏航角: {(gyroy / 10).toFixed(1)}°/S</Text>
          <Slider
            style={styles.slider}
            disabled
            value={getCenterPointPos(gyroy)}
            minimumValue={-100}
            maximumValue={100}
            step={0.1}
            minimumTrackTintColor="#DF6069"
            maximumTrackTintColor="grey"
          />

          <Text>滚转角: {(gyroz / 10).toFixed(1)}°/S</Text>
          <Slider
            style={styles.slider}
            disabled
            value={getCenterPointPos(gyroz)}
            minimumValue={-100}
            maximumValue={100}
            step={0.1}
            minimumTrackTintColor="#DF6069"
            maximumTrackTintColor="grey"
          />

          <Text>加速度器</Text>
          <View>
            <Text variant="bodySmall">X: {accelx}</Text>
            <Text variant="bodySmall">Y: {accely}</Text>
            <Text variant="bodySmall">Z: {accelz}</Text>
          </View>
        </View>

        <Divider />

        <View>
          <View>
            <Text>麦克风指示灯</Text>
            <View>
              <RadioButton.Group
                onValueChange={newValue => handleMicroLed(newValue)}
                value={microLed}>
                <View style={styles.playerItem}>
                  <Text>关</Text>
                  <RadioButton value="0" />
                </View>
                <View style={styles.playerItem}>
                  <Text>开</Text>
                  <RadioButton value="1" />
                </View>
              </RadioButton.Group>
            </View>
          </View>

          <View>
            <Text>灯带颜色</Text>
            <View>
              <ColorPicker
                ref={colorPickerRef}
                color={currentColor}
                swatchesOnly={false}
                onColorChangeComplete={handleColorChangeComplete}
                thumbSize={20}
                sliderSize={20}
                noSnap={true}
                row={false}
                swatchesLast={false}
                swatches={false}
                discrete={false}
                useNativeDriver={false}
                useNativeLayout={false}
              />
            </View>
          </View>

          <View>
            <Text>玩家指示灯</Text>
            <View>
              <RadioButton.Group
                onValueChange={newValue => setPlayerLed(newValue)}
                value={playerLed}>
                <View style={styles.playerItem}>
                  <Text>Close</Text>
                  <RadioButton value="0" />
                </View>
                <View style={styles.playerItem}>
                  <Text>1</Text>
                  <RadioButton value="1" />
                </View>
                <View style={styles.playerItem}>
                  <Text>2</Text>
                  <RadioButton value="2" />
                </View>
                <View style={styles.playerItem}>
                  <Text>3</Text>
                  <RadioButton value="3" />
                </View>
                <View style={styles.playerItem}>
                  <Text>4</Text>
                  <RadioButton value="4" />
                </View>
                <View style={styles.playerItem}>
                  <Text>All</Text>
                  <RadioButton value="5" />
                </View>
              </RadioButton.Group>
            </View>
          </View>

          <View>
            <Text>玩家指示灯亮度</Text>
            <View>
              <RadioButton.Group
                onValueChange={newValue => setPlayerLight(newValue)}
                value={playerLight}>
                <View style={styles.playerItem}>
                  <Text>亮</Text>
                  <RadioButton value="0" />
                </View>
                <View style={styles.playerItem}>
                  <Text>中</Text>
                  <RadioButton value="1" />
                </View>
                <View style={styles.playerItem}>
                  <Text>暗</Text>
                  <RadioButton value="2" />
                </View>
              </RadioButton.Group>
            </View>
          </View>

          <View>
            <Text>震动(强)</Text>
            <View>
              <Slider
                style={styles.slider}
                value={0}
                minimumValue={0}
                maximumValue={255}
                step={1}
                minimumTrackTintColor="#DF6069"
                maximumTrackTintColor="grey"
              />
            </View>
          </View>

          <View>
            <Text>震动(弱)</Text>
            <View>
              <Slider
                style={styles.slider}
                value={0}
                minimumValue={0}
                maximumValue={255}
                step={1}
                minimumTrackTintColor="#DF6069"
                maximumTrackTintColor="grey"
              />
            </View>
          </View>

          <View>
            <Text>左自适应扳机</Text>
            <View>
              <RadioButton.Group
                onValueChange={newValue => setPlayerLight(newValue)}
                value={playerLight}>
                <View style={styles.playerItem}>
                  <Text>关</Text>
                  <RadioButton value="0" />
                </View>
                <View style={styles.playerItem}>
                  <Text>阻尼</Text>
                  <RadioButton value="1" />
                </View>
                <View style={styles.playerItem}>
                  <Text>扳机</Text>
                  <RadioButton value="2" />
                </View>
                <View style={styles.playerItem}>
                  <Text>自动步枪</Text>
                  <RadioButton value="3" />
                </View>
              </RadioButton.Group>
            </View>
          </View>

          <View>
            <Text>右自适应扳机</Text>
            <View>
              <RadioButton.Group
                onValueChange={newValue => setPlayerLight(newValue)}
                value={playerLight}>
                <View style={styles.playerItem}>
                  <Text>关</Text>
                  <RadioButton value="0" />
                </View>
                <View style={styles.playerItem}>
                  <Text>阻尼</Text>
                  <RadioButton value="1" />
                </View>
                <View style={styles.playerItem}>
                  <Text>扳机</Text>
                  <RadioButton value="2" />
                </View>
                <View style={styles.playerItem}>
                  <Text>自动步枪</Text>
                  <RadioButton value="3" />
                </View>
              </RadioButton.Group>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  statesWrap: {
    paddingBottom: 50,
  },
  states: {
    flexDirection: 'row',
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  stateLeft: {
    width: 5,
    height: 30,
  },
  stateRight: {
    paddingLeft: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DsScreen;
