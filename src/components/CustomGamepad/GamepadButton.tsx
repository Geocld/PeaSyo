import React from 'react';
import ButtonView from '../ButtonView';

type Props = {
  name: string;
  psName: string;
  width?: number;
  height?: number;
  scale?: number;
  style: any;
  onPressIn: (name: string) => void;
  onPressOut: (name: string) => void;
};

const mapping: any = {
  LeftTrigger: 'control_button_l2',
  RightTrigger: 'control_button_r2',
  LeftShoulder: 'control_button_l1',
  RightShoulder: 'control_button_r1',
  A: 'control_button_cross',
  B: 'control_button_moon',
  X: 'control_button_box',
  Y: 'control_button_pyramid',
  LeftThumb: 'control_button_l3',
  RightThumb: 'control_button_r3',
  View: 'control_button_share',
  Nexus: 'control_button_home',
  Menu: 'control_button_options',
  DPadUp: 'control_button_up',
  DPadLeft: 'control_button_left',
  DPadDown: 'control_button_down',
  DPadRight: 'control_button_right',
  Touchpad: 'control_button_touchpad',
};

const GamepadButton: React.FC<Props> = ({
  name,
  psName,
  width = 50,
  height = 50,
  scale = 1,
  onPressIn,
  onPressOut,
  style,
}) => {
  if (['View', 'Nexus', 'Menu'].indexOf(name) > -1) {
    width = 50;
    height = 50;
  }
  return (
    <ButtonView
      style={[
        style,
        {
          width: width * scale,
          height: height * scale,
        },
      ]}
      buttonName={mapping[name]}
      onPressIn={() => onPressIn(psName)}
      onPressOut={() => onPressOut(psName)}
    />
  );
};

export default GamepadButton;
