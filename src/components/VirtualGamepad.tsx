import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import AnalogStick from '../components/AnalogStick';
import ButtonView from './ButtonView';
import {getSettings} from '../store/settingStore';

type Props = {
  opacity: number;
  onPressIn: (name: string) => void;
  onPressOut: (name: string) => void;
  onStickMove: (id: string, position: any) => void;
};

const VirtualGamepad: React.FC<Props> = ({
  opacity = 0.7,
  onPressIn,
  onPressOut,
  onStickMove,
}) => {
  const settings = getSettings();

  const handlePressIn = (name: string) => {
    onPressIn && onPressIn(name);
  };

  const handlePressOut = (name: string) => {
    setTimeout(() => {
      onPressOut && onPressOut(name);
    }, 5);
  };

  const handleStickMove = (id: string, data: any) => {
    onStickMove && onStickMove(id, data);
  };

  const {width, height} = Dimensions.get('window');

  const nexusLeft = width * 0.5 - 20;
  const viewLeft = width * 0.5 - 100;
  const menuLeft = width * 0.5 + 60;
  const touchpadLeft = width * 0.5 - 200;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <ButtonView
        style={[styles.button, styles.lt, {opacity}]}
        buttonName="control_button_l2"
        onPressIn={() => handlePressIn('LeftTrigger')}
        onPressOut={() => handlePressOut('LeftTrigger')}
      />

      <ButtonView
        style={[styles.button, styles.rt, {opacity}]}
        buttonName="control_button_r2"
        onPressIn={() => handlePressIn('RightTrigger')}
        onPressOut={() => handlePressOut('RightTrigger')}
      />

      <ButtonView
        style={[styles.button, styles.lb, {opacity}]}
        buttonName="control_button_l1"
        onPressIn={() => handlePressIn('L1')}
        onPressOut={() => handlePressOut('L1')}
      />

      <ButtonView
        style={[styles.button, styles.rb, {opacity}]}
        buttonName="control_button_r1"
        onPressIn={() => handlePressIn('R1')}
        onPressOut={() => handlePressOut('R1')}
      />

      <ButtonView
        style={[styles.button, styles.a, {opacity}]}
        buttonName="control_button_cross"
        onPressIn={() => handlePressIn('CROSS')}
        onPressOut={() => handlePressOut('CROSS')}
      />

      <ButtonView
        style={[styles.button, styles.b, {opacity}]}
        buttonName="control_button_moon"
        onPressIn={() => handlePressIn('MOON')}
        onPressOut={() => handlePressOut('MOON')}
      />

      <ButtonView
        style={[styles.button, styles.x, {opacity}]}
        buttonName="control_button_box"
        onPressIn={() => handlePressIn('BOX')}
        onPressOut={() => handlePressOut('BOX')}
      />

      <ButtonView
        style={[styles.button, styles.y, {opacity}]}
        buttonName="control_button_pyramid"
        onPressIn={() => handlePressIn('PYRAMID')}
        onPressOut={() => handlePressOut('PYRAMID')}
      />

      <ButtonView
        style={[styles.button, styles.l3, {opacity}]}
        buttonName="control_button_l3"
        onPressIn={() => handlePressIn('L3')}
        onPressOut={() => handlePressOut('L3')}
      />

      <ButtonView
        style={[styles.button, styles.r3, {opacity}]}
        buttonName="control_button_r3"
        onPressIn={() => handlePressIn('R3')}
        onPressOut={() => handlePressOut('R3')}
      />

      <ButtonView
        style={[styles.button, styles.view, {left: viewLeft, opacity}]}
        buttonName="control_button_share"
        onPressIn={() => handlePressIn('SHARE')}
        onPressOut={() => handlePressOut('SHARE')}
      />

      <ButtonView
        style={[styles.button, styles.nexus, {left: nexusLeft, opacity}]}
        buttonName="control_button_home"
        onPressIn={() => handlePressIn('PS')}
        onPressOut={() => handlePressOut('PS')}
      />

      <ButtonView
        style={[styles.button, styles.menu, {left: menuLeft, opacity}]}
        buttonName="control_button_options"
        onPressIn={() => handlePressIn('OPTIONS')}
        onPressOut={() => handlePressOut('OPTIONS')}
      />

      <ButtonView
        style={[styles.button, styles.dpadTop, {opacity}]}
        buttonName="control_button_up"
        onPressIn={() => handlePressIn('DPAD_UP')}
        onPressOut={() => handlePressOut('DPAD_UP')}
      />

      <ButtonView
        style={[styles.button, styles.dpadLeft, {opacity}]}
        buttonName="control_button_left"
        onPressIn={() => handlePressIn('DPAD_LEFT')}
        onPressOut={() => handlePressOut('DPAD_LEFT')}
      />

      <ButtonView
        style={[styles.button, styles.dpadBottom, {opacity}]}
        buttonName="control_button_down"
        onPressIn={() => handlePressIn('DPAD_DOWN')}
        onPressOut={() => handlePressOut('DPAD_DOWN')}
      />

      <ButtonView
        style={[styles.button, styles.dpadRight, {opacity}]}
        buttonName="control_button_right"
        onPressIn={() => handlePressIn('DPAD_RIGHT')}
        onPressOut={() => handlePressOut('DPAD_RIGHT')}
      />

      <ButtonView
        style={[styles.button, styles.touchpad, {left: touchpadLeft, opacity}]}
        buttonName="control_button_touchpad"
        onPressIn={() => handlePressIn('TOUCHPAD')}
        onPressOut={() => handlePressOut('TOUCHPAD')}
      />

      {settings.virtual_gamepad_joystick === 1 ? (
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 9,
            width: width * 0.5,
            height: height,
          }}>
          <AnalogStick
            style={{
              width: width * 0.5,
              height: height,
              opacity,
            }}
            radius={140}
            handleRadius={80}
            onStickChange={(data: any) => handleStickMove('left', data)}
          />
        </View>
      ) : null}

      {settings.virtual_gamepad_joystick === 1 ? (
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 9,
            width: width * 0.5,
            height: height,
          }}>
          <AnalogStick
            style={{
              width: width * 0.5,
              height: height,
              opacity,
            }}
            radius={150}
            handleRadius={100}
            onStickChange={(data: any) => handleStickMove('right', data)}
          />
        </View>
      ) : null}

      {settings.virtual_gamepad_joystick === 0 ? (
        <View style={[styles.button, styles.leftJs, {opacity}]}>
          <AnalogStick
            style={styles.analogStick}
            radius={140}
            handleRadius={80}
            onStickChange={(data: any) => handleStickMove('left', data)}
          />
        </View>
      ) : null}

      {settings.virtual_gamepad_joystick === 0 ? (
        <View style={[styles.button, styles.rightJs, {opacity}]}>
          <AnalogStick
            style={styles.analogStick}
            radius={150}
            handleRadius={100}
            onStickChange={(data: any) => handleStickMove('right', data)}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    // backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 9,
  },
  button: {
    width: 50,
    height: 50,
    opacity: 0.6,
    position: 'absolute',
    zIndex: 10,
  },
  lt: {
    width: 80,
    height: 80,
    left: 20,
    top: 10,
  },
  rt: {
    width: 80,
    height: 80,
    right: 20,
    top: 10,
  },
  lb: {
    width: 80,
    height: 80,
    left: 70,
    top: 60,
  },
  rb: {
    width: 80,
    height: 80,
    right: 70,
    top: 60,
  },
  a: {
    bottom: 50,
    right: 80,
  },
  b: {
    bottom: 100,
    right: 30,
  },
  x: {
    bottom: 100,
    right: 130,
  },
  y: {
    bottom: 150,
    right: 80,
  },
  l3: {
    bottom: 80,
    left: 225,
  },
  r3: {
    bottom: 40,
    right: 235,
  },
  view: {
    bottom: 0,
  },
  nexus: {
    bottom: 0,
  },
  menu: {
    bottom: 0,
  },
  leftJs: {
    left: 180,
    bottom: 150,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  rightJs: {
    right: 200,
    bottom: 100,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  dpadLeft: {
    width: 60,
    height: 60,
    left: 20,
    bottom: 80,
  },
  dpadTop: {
    width: 60,
    height: 60,
    left: 75,
    bottom: 135,
  },
  dpadRight: {
    width: 60,
    height: 60,
    left: 130,
    bottom: 80,
  },
  dpadBottom: {
    width: 60,
    height: 60,
    left: 75,
    bottom: 25,
  },
  analogStick: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, .5)',
    overflow: 'hidden',
  },
  touchpad: {
    bottom: 0,
  },
});

export default VirtualGamepad;
