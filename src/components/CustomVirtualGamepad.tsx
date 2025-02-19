import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import GamepadButton from './CustomGamepad/GamepadButton';
import Dpad from './CustomGamepad/Dpad';
import {ReactNativeJoystick} from '../components/Joystick';
import {getSettings} from '../store/gamepadStore';

type Props = {
  title: string;
  opacity: number;
  onPressIn: (name: string) => void;
  onPressOut: (name: string) => void;
  onStickMove: (id: string, position: any) => void;
};

const CustomVirtualGamepad: React.FC<Props> = ({
  title,
  opacity = 0.6,
  onPressIn,
  onPressOut,
  onStickMove,
}) => {
  const [buttons, setButtons] = React.useState<any>([]);

  React.useEffect(() => {
    const _settings = getSettings();
    const {width, height} = Dimensions.get('window');

    const nexusLeft = width * 0.5 - 20;
    const viewLeft = width * 0.5 - 100;
    const menuLeft = width * 0.5 + 60;

    const _buttons = [
      {
        name: 'LeftTrigger',
        psName: 'LeftTrigger',
        x: 20,
        y: 10,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'RightTrigger',
        psName: 'RightTrigger',
        x: width - 45,
        y: 10,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'LeftShoulder',
        psName: 'L1',
        x: 20,
        y: 80,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'RightShoulder',
        psName: 'R1',
        x: width - 45,
        y: 80,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'A',
        psName: 'CROSS',
        x: width - 70,
        y: height - 50,
        scale: 1,
        show: true,
      },
      {
        name: 'B',
        psName: 'MOON',
        x: width - 30,
        y: height - 90,
        scale: 1,
        show: true,
      },
      {
        name: 'X',
        psName: 'BOX',
        x: width - 110,
        y: height - 90,
        scale: 1,
        show: true,
      },
      {
        name: 'Y',
        psName: 'PYRAMID',
        x: width - 70,
        y: height - 130,
        scale: 1,
        show: true,
      },
      {
        name: 'LeftThumb',
        psName: 'L3',
        x: 150,
        y: height - 60,
        width: 50,
        height: 50,
        scale: 1,
        show: true,
      },
      {
        name: 'RightThumb',
        psName: 'R3',
        x: width - 210,
        y: height - 40,
        width: 50,
        height: 50,
        scale: 1,
        show: true,
      },
      {
        name: 'View',
        psName: 'SHARE',
        x: viewLeft,
        y: height - 60,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'Nexus',
        psName: 'PS',
        x: nexusLeft,
        y: height - 40,
        width: 50,
        height: 50,
        scale: 1,
        show: true,
      },
      {
        name: 'Menu',
        psName: 'OPTIONS',
        x: menuLeft,
        y: height - 60,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'Dpad',
        x: 20,
        y: height - 170,
        width: 100,
        height: 100,
        scale: 1,
        show: true,
      },
      {
        name: 'LeftStick',
        x: 175,
        y: height - 185,
        show: true,
      },
      {
        name: 'RightStick',
        x: width - 255,
        y: height - 155,
        show: true,
      },
    ];
    if (_settings[title]) {
      const exitButtons = _settings[title];
      setButtons(exitButtons);
    } else {
      setButtons(_buttons);
    }
  }, [title]);

  const handlePressIn = (name: string) => {
    onPressIn && onPressIn(name);
  };

  const handlePressOut = (name: string) => {
    onPressOut && onPressOut(name);
  };

  const handleStickMove = (id: string, data: any) => {
    onStickMove && onStickMove(id, data);
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {buttons.map((button: any) => {
        if (!button.show) {
          return null;
        }
        if (button.name === 'Dpad') {
          return (
            <Dpad
              key={button.name}
              scale={button.scale}
              style={{
                opacity: opacity,
                left: button.x - 15,
                top: button.y + 100,
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
          );
        } else if (button.name === 'LeftStick') {
          return (
            <View
              key={button.name}
              style={[
                styles.button,
                {top: button.y, left: button.x},
                {opacity},
              ]}>
              <ReactNativeJoystick
                color="#ffffff"
                radius={50}
                onMove={data => handleStickMove('left', data)}
                onStart={data => handleStickMove('left', data)}
                onStop={data => handleStickMove('left', data)}
              />
            </View>
          );
        } else if (button.name === 'RightStick') {
          return (
            <View
              key={button.name}
              style={[
                styles.button,
                {top: button.y, left: button.x},
                {opacity},
              ]}>
              <ReactNativeJoystick
                color="#ffffff"
                style={{opacity}}
                radius={50}
                onMove={data => handleStickMove('right', data)}
                onStart={data => handleStickMove('right', data)}
                onStop={data => handleStickMove('right', data)}
              />
            </View>
          );
        } else {
          return (
            <GamepadButton
              key={button.name}
              name={button.name}
              psName={button.psName}
              scale={button.scale}
              width={button.width}
              height={button.height}
              style={[
                styles.button,
                {opacity},
                {top: button.y, left: button.x},
              ]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
          );
        }
      })}
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
});

export default CustomVirtualGamepad;
