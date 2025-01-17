import React from 'react';
import {TouchableOpacity} from 'react-native';
import {GestureDetector, Gesture} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
import {SvgXml} from 'react-native-svg';
import icons from '../common/virtualgp';

type Props = {
  name: string;
  style: any;
  width?: number;
  height?: number;
  onPressIn: () => void;
  onPressOut: () => void;
};

const GamepadButton: React.FC<Props> = ({
  name,
  width = 60,
  height = 60,
  onPressIn,
  onPressOut,
  style,
}) => {
  const longPressGesture = Gesture.LongPress()
    .minDuration(16)
    .onStart(() => {
      'worklet';
      onPressIn && runOnJS(onPressIn)();
    })
    .onEnd(() => {
      'worklet';
      onPressOut && runOnJS(onPressOut)();
    });

  return (
    <GestureDetector gesture={longPressGesture}>
      <TouchableOpacity style={style}>
        <SvgXml xml={icons[name]} width={width} height={height} />
      </TouchableOpacity>
    </GestureDetector>
  );
};

export default GamepadButton;
