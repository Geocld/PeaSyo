import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import GamepadButton from './CustomGamepad/GamepadButton';
import AnalogStick from '../components/AnalogStick';
import {getSettings as getLocalSettings} from '../store/settingStore';
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
  const localSettings = getLocalSettings();
  const {width: clientW, height: clientH} = Dimensions.get('window');

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
        if (button.name === 'LeftStick') {
          if (localSettings.virtual_gamepad_joystick === 1) {
            return (
              <View
                key={button.name}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  zIndex: 9,
                  width: clientW * 0.5,
                  height: clientH,
                }}>
                <AnalogStick
                  style={{
                    width: clientW * 0.5,
                    height: clientH,
                    opacity,
                  }}
                  radius={140}
                  handleRadius={80}
                  onStickChange={(data: any) => handleStickMove('left', data)}
                />
              </View>
            );
          } else {
            return (
              <View
                key={button.name}
                style={[
                  styles.button,
                  {top: button.y, left: button.x},
                  {opacity},
                ]}>
                <View style={styles.leftJs}>
                  <AnalogStick
                    style={styles.analogStick}
                    radius={140}
                    handleRadius={80}
                    onStickChange={(data: any) => handleStickMove('left', data)}
                  />
                </View>
              </View>
            );
          }
        } else if (button.name === 'RightStick') {
          if (localSettings.virtual_gamepad_joystick === 1) {
            return (
              <View
                key={button.name}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  zIndex: 9,
                  width: clientW * 0.5,
                  height: clientH,
                }}>
                <AnalogStick
                  style={{
                    width: clientW * 0.5,
                    height: clientH,
                    opacity,
                  }}
                  radius={150}
                  handleRadius={100}
                  onStickChange={(data: any) => handleStickMove('right', data)}
                />
              </View>
            );
          } else {
            return (
              <View
                key={button.name}
                style={[
                  styles.button,
                  {top: button.y, left: button.x},
                  {opacity},
                ]}>
                <View style={styles.rightJs}>
                  <AnalogStick
                    style={styles.analogStick}
                    radius={140}
                    handleRadius={80}
                    onStickChange={(data: any) =>
                      handleStickMove('right', data)
                    }
                  />
                </View>
              </View>
            );
          }
        } else {
          let y = button.y;
          let x = button.x;
          if (button.name === 'View') {
            y += 20;
          }
          if (button.name === 'Menu') {
            y += 15;
          }
          if (button.name === 'Touchpad') {
            y -= 5;
          }
          return (
            <GamepadButton
              key={button.name}
              name={button.name}
              psName={button.psName}
              width={button.width || 50}
              height={button.height || 50}
              scale={button.scale}
              style={[styles.button, {opacity}, {top: y, left: x}]}
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
    opacity: 0.6,
    position: 'absolute',
    zIndex: 10,
  },
  leftJs: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  rightJs: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  analogStick: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, .5)',
    overflow: 'hidden',
  },
});

export default CustomVirtualGamepad;
