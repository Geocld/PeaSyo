import React from 'react';
import {TouchableOpacity} from 'react-native';
import {GestureDetector, Gesture} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
import {SvgXml} from 'react-native-svg';
import icons from '../../common/virtualgp';

type Props = {
  name: string;
  psName?: string;
  width?: number;
  height?: number;
  scale?: number;
  style: any;
  onPressIn: (name: string) => void;
  onPressOut: (name: string) => void;
};

const GamepadButton: React.FC<Props> = ({
  name,
  psName = '',
  width = 60,
  height = 60,
  scale = 1,
  onPressIn,
  onPressOut,
  style,
}) => {
  const longPressGesture = Gesture.LongPress()
    .onStart(() => {
      'worklet';
      onPressIn && runOnJS(onPressIn)(psName);
    })
    .onEnd(() => {
      'worklet';
      onPressOut && runOnJS(onPressOut)(psName);
    })
    .minDuration(16);

  return (
    <GestureDetector gesture={longPressGesture}>
      <TouchableOpacity style={style}>
        <SvgXml
          xml={icons[name]}
          width={width * scale}
          height={height * scale}
        />
      </TouchableOpacity>
    </GestureDetector>
  );
};

export default GamepadButton;
