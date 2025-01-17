import React from 'react';
import {StyleSheet, View, TouchableOpacity, Dimensions} from 'react-native';
import GamepadButton from './GamepadButton';
import {ReactNativeJoystick} from '../components/Joystick';

type Props = {
  opacity: number;
  onPressIn: (name: string) => void;
  onPressOut: (name: string) => void;
  onStickMove: (id: string, position: any) => void;
};

const VirtualGamepad: React.FC<Props> = ({
  opacity = 0.6,
  onPressIn,
  onPressOut,
  onStickMove,
}) => {
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

  const {width} = Dimensions.get('window');

  const nexusLeft = width * 0.5 - 20;
  const viewLeft = width * 0.5 - 100;
  const menuLeft = width * 0.5 + 60;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <GamepadButton
        name="LeftTrigger"
        width={100}
        height={100}
        style={[styles.button, styles.lt, {opacity}]}
        onPressIn={() => handlePressIn('LeftTrigger')}
        onPressOut={() => handlePressOut('LeftTrigger')}
      />

      <GamepadButton
        name="RightTrigger"
        width={100}
        height={100}
        style={[styles.button, styles.rt, {opacity}]}
        onPressIn={() => handlePressIn('RightTrigger')}
        onPressOut={() => handlePressOut('RightTrigger')}
      />

      <GamepadButton
        name="LeftShoulder"
        width={100}
        height={100}
        style={[styles.button, styles.lb, {opacity}]}
        onPressIn={() => handlePressIn('L1')}
        onPressOut={() => handlePressOut('L1')}
      />

      <GamepadButton
        name="RightShoulder"
        width={100}
        height={100}
        style={[styles.button, styles.rb, {opacity}]}
        onPressIn={() => handlePressIn('R1')}
        onPressOut={() => handlePressOut('R1')}
      />

      <GamepadButton
        name="A"
        style={[styles.button, styles.a, {opacity}]}
        onPressIn={() => handlePressIn('CROSS')}
        onPressOut={() => handlePressOut('CROSS')}
      />

      <GamepadButton
        name="B"
        style={[styles.button, styles.b, {opacity}]}
        onPressIn={() => handlePressIn('MOON')}
        onPressOut={() => handlePressOut('MOON')}
      />

      <GamepadButton
        name="X"
        style={[styles.button, styles.x, {opacity}]}
        onPressIn={() => handlePressIn('BOX')}
        onPressOut={() => handlePressOut('BOX')}
      />

      <GamepadButton
        name="Y"
        style={[styles.button, styles.y, {opacity}]}
        onPressIn={() => handlePressIn('PYRAMID')}
        onPressOut={() => handlePressOut('PYRAMID')}
      />

      <GamepadButton
        name="LeftThumb"
        width={50}
        height={50}
        style={[styles.button, styles.l3, {opacity}]}
        onPressIn={() => handlePressIn('L3')}
        onPressOut={() => handlePressOut('L3')}
      />

      <GamepadButton
        name="RightThumb"
        width={50}
        height={50}
        style={[styles.button, styles.r3, {opacity}]}
        onPressIn={() => handlePressIn('R3')}
        onPressOut={() => handlePressOut('R3')}
      />

      <GamepadButton
        name="View"
        width={100}
        height={100}
        style={[styles.button, styles.view, {left: viewLeft, opacity}]}
        onPressIn={() => handlePressIn('SHARE')}
        onPressOut={() => handlePressOut('SHARE')}
      />

      <GamepadButton
        name="Nexus"
        width={50}
        height={50}
        style={[styles.button, styles.nexus, {left: nexusLeft, opacity}]}
        onPressIn={() => handlePressIn('PS')}
        onPressOut={() => handlePressOut('PS')}
      />

      <GamepadButton
        name="Menu"
        width={100}
        height={100}
        style={[styles.button, styles.menu, {left: menuLeft, opacity}]}
        onPressIn={() => handlePressIn('OPTIONS')}
        onPressOut={() => handlePressOut('OPTIONS')}
      />

      <TouchableOpacity
        style={[styles.button, styles.dpadLeft, {opacity}]}
        onPressIn={() => {
          handlePressIn('DPAD_LEFT');
        }}
        onPressOut={() => {
          handlePressOut('DPAD_LEFT');
        }}
      />
      <TouchableOpacity
        style={[styles.button, styles.dpadTop, {opacity}]}
        onPressIn={() => {
          handlePressIn('DPAD_UP');
        }}
        onPressOut={() => {
          handlePressOut('DPAD_UP');
        }}
      />
      <TouchableOpacity
        style={[styles.button, styles.dpadRight, {opacity}]}
        onPressIn={() => {
          handlePressIn('DPAD_RIGHT');
        }}
        onPressOut={() => {
          handlePressOut('DPAD_RIGHT');
        }}
      />
      <TouchableOpacity
        style={[styles.button, styles.dpadBottom, {opacity}]}
        onPressIn={() => {
          handlePressIn('DPAD_DOWN');
        }}
        onPressOut={() => {
          handlePressOut('DPAD_DOWN');
        }}
      />

      <View style={[styles.button, styles.leftJs, {opacity}]}>
        <ReactNativeJoystick
          color="#ffffff"
          radius={50}
          onMove={data => handleStickMove('left', data)}
          onStart={data => handleStickMove('left', data)}
          onStop={data => handleStickMove('left', data)}
        />
      </View>

      <View style={[styles.button, styles.rightJs, {opacity}]}>
        <ReactNativeJoystick
          color="#ffffff"
          style={{opacity}}
          radius={50}
          onMove={data => handleStickMove('right', data)}
          onStart={data => handleStickMove('right', data)}
          onStop={data => handleStickMove('right', data)}
        />
      </View>
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
    opacity: 0.5,
    position: 'absolute',
  },
  lt: {
    left: 20,
    top: 10,
  },
  rt: {
    right: -15,
    top: 10,
  },
  lb: {
    left: 20,
    top: 80,
  },
  rb: {
    right: -15,
    top: 80,
  },
  a: {
    bottom: 50,
    right: 50,
  },
  b: {
    bottom: 90,
    right: 10,
  },
  x: {
    bottom: 90,
    right: 90,
  },
  y: {
    bottom: 130,
    right: 50,
  },
  l3: {
    bottom: 30,
    left: 130,
  },
  r3: {
    bottom: 10,
    right: 210,
  },
  view: {
    bottom: 0,
  },
  nexus: {
    bottom: 30,
  },
  menu: {
    bottom: 0,
  },
  leftJs: {
    left: 100,
    bottom: 110,
  },
  rightJs: {
    right: 180,
    bottom: 80,
  },
  dpadLeft: {
    width: 30,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    left: 30,
    bottom: 80,
    borderRightWidth: 0,
  },
  dpadTop: {
    width: 20,
    height: 30,
    borderWidth: 2,
    borderColor: '#fff',
    left: 58,
    bottom: 100,
    borderBottomWidth: 0,
  },
  dpadRight: {
    width: 30,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    left: 76,
    bottom: 80,
    borderLeftWidth: 0,
  },
  dpadBottom: {
    width: 20,
    height: 30,
    borderWidth: 2,
    borderColor: '#fff',
    left: 58,
    bottom: 50,
    borderTopWidth: 0,
  },
});

export default VirtualGamepad;
