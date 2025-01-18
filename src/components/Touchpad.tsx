import React from 'react';
import {StyleSheet, View} from 'react-native';
import {GestureDetector, Gesture} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

// DualShock4 touchpad is 1920 x 942
const TOUCHPAD_WIDTH = 1920;
const TOUCHPAD_HEIGHT = 942;

// DualSense touchpad is 1919 x 1079
const PS5_TOUCHPAD_WIDTH = 1919;
const PS5_TOUCHPAD_HEIGHT = 1079;

const SHORT_BUTTON_PRESS_DURATION_MS = 200;
const BUTTON_HOLD_DELAY_MS = 500;

const VIEW_WIDTH = 350;
const VIEW_HEIGHT = (VIEW_WIDTH * 9) / 16;

const DOT_SIZE = 5;
const DOT_SPACING = 15;

const SHOW_OPACITY = 0.2;

const MAX_TOUCH_ID = 120;

type Props = {
  isPS5: boolean;
  onTap: (isPressed: boolean, nextId: number, touches: any[]) => void;
  onTouch: (mask: number, nextId: number, touches: any[]) => void;
};

const Touchpad: React.FC<Props> = ({isPS5 = true, onTap, onTouch}) => {
  const isMoving = useSharedValue(false);

  const currentId = useSharedValue(-1);
  const nextId = useSharedValue(-1);
  const touchId1 = useSharedValue(-1);
  const touchId2 = useSharedValue(-1);

  const opacity = useSharedValue(0);

  const normalizeCoordinates = (x: number, y: number) => {
    'worklet';
    const touchpadWidth = isPS5 ? PS5_TOUCHPAD_WIDTH : TOUCHPAD_WIDTH;
    const touchpadHeight = isPS5 ? PS5_TOUCHPAD_HEIGHT : TOUCHPAD_HEIGHT;

    const normX = Math.min(
      Math.max(0, Math.round((x * touchpadWidth) / VIEW_WIDTH)),
      touchpadWidth - 1,
    );
    const normY = Math.min(
      Math.max(0, Math.round((y * touchpadHeight) / VIEW_HEIGHT)),
      touchpadHeight - 1,
    );
    return {x: normX, y: normY};
  };

  // 移动
  const pan = Gesture.Pan()
    .maxPointers(2)
    .minDistance(30)
    .runOnJS(true)
    .onTouchesMove(e => {
      // console.log('pan onTouchesMove');
      opacity.value = SHOW_OPACITY;
      isMoving.value = true;
      const allTouches = e.allTouches;

      const touches = [0, 0, -1, 0, 0, -1];

      let _currentId = currentId.value;
      let _nextId = nextId.value;
      let _touchId1 = touchId1.value;
      let _touchId2 = touchId2.value;

      allTouches.forEach(touch => {
        if (touch.id === 0) {
          if (_touchId1 === -1) {
            _currentId = _currentId + 1;
            _nextId = _currentId + 1;
            _touchId1 = _currentId;
          }
          const normalTouch = normalizeCoordinates(touch.x, touch.y);
          touches[0] = normalTouch.x;
          touches[1] = normalTouch.y;
          touches[2] = _touchId1;
        } else {
          if (_touchId2 === -1) {
            _currentId = _currentId + 1;
            _nextId = _currentId + 1;
            _touchId2 = _currentId;
          }
          const normalTouch = normalizeCoordinates(touch.x, touch.y);
          touches[3] = normalTouch.x;
          touches[4] = normalTouch.y;
          touches[5] = _touchId2;
        }
      });

      runOnJS(onTouch)(0, _nextId, touches);

      if (_nextId >= MAX_TOUCH_ID) {
        currentId.value = -1;
        nextId.value = -1;
        touchId1.value = -1;
        touchId2.value = -1;
      } else {
        currentId.value = _currentId;
        nextId.value = _nextId;
        touchId1.value = _touchId1;
        touchId2.value = _touchId2;
      }
    })
    .onTouchesUp(e => {
      if (isMoving.value) {
        // console.log('pan onTouchesUp:', e);
        isMoving.value = false;
        opacity.value = withDelay(2000, withTiming(0));

        const changedTouches = e.changedTouches;

        const touches = [0, 0, -1, 0, 0, -1];

        changedTouches.forEach(touch => {
          if (touch.id === 0) {
            touchId1.value = -1;
            const normalTouch = normalizeCoordinates(touch.x, touch.y);
            touches[0] = normalTouch.x;
            touches[1] = normalTouch.y;
            touches[2] = -1;
          } else {
            touchId2.value = -1;
            const normalTouch = normalizeCoordinates(touch.x, touch.y);
            touches[3] = normalTouch.x;
            touches[4] = normalTouch.y;
            touches[5] = -1;
          }
        });
        runOnJS(onTouch)(0, nextId.value, touches);
      }
    });

  // 单击
  const singleTap = Gesture.Tap()
    .maxDuration(SHORT_BUTTON_PRESS_DURATION_MS)
    .maxDistance(10)
    .onStart(e => {
      console.log('Single tap:', e);

      opacity.value = SHOW_OPACITY;

      let _currentId = currentId.value;
      let _nextId = nextId.value;

      _currentId = _currentId + 1;
      _nextId = _currentId + 1;

      const normalXY = normalizeCoordinates(e.x, e.y);

      const touches = [normalXY.x, normalXY.y, _currentId, 0, 0, -1];

      runOnJS(onTap)(true, _nextId, touches);

      if (_nextId >= MAX_TOUCH_ID) {
        currentId.value = -1;
        nextId.value = -1;
      } else {
        currentId.value = _currentId;
        nextId.value = _nextId;
      }
    })
    .onEnd(e => {
      const normalXY = normalizeCoordinates(e.x, e.y);
      const touches = [normalXY.x, normalXY.y, -1, 0, 0, -1];

      opacity.value = withDelay(2000, withTiming(0));

      runOnJS(onTap)(false, nextId.value, touches);
    });

  // 长按
  const longPress = Gesture.LongPress()
    .minDuration(BUTTON_HOLD_DELAY_MS)
    .onStart(e => {
      console.log('LongPress start:', e);

      opacity.value = SHOW_OPACITY;

      let _currentId = currentId.value;
      let _nextId = nextId.value;

      _currentId = _currentId + 1;
      _nextId = _currentId + 1;

      const normalXY = normalizeCoordinates(e.x, e.y);

      const touches = [normalXY.x, normalXY.y, _currentId, 0, 0, -1];

      runOnJS(onTap)(true, _nextId, touches);

      if (_nextId >= MAX_TOUCH_ID) {
        currentId.value = -1;
        nextId.value = -1;
      } else {
        currentId.value = _currentId;
        nextId.value = _nextId;
      }
    })
    .onEnd(e => {
      const normalXY = normalizeCoordinates(e.x, e.y);
      const touches = [normalXY.x, normalXY.y, -1, 0, 0, -1];

      opacity.value = withDelay(2000, withTiming(0));

      runOnJS(onTap)(false, nextId.value, touches);
    });

  const gesture = Gesture.Race(pan, longPress, singleTap);

  const generateDots = () => {
    const rows = Math.ceil(VIEW_HEIGHT / DOT_SPACING);
    const columns = Math.ceil(VIEW_WIDTH / DOT_SPACING);
    const dots: any[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        dots.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.dot,
              {
                left: col * DOT_SPACING,
                top: row * DOT_SPACING,
              },
            ]}
          />,
        );
      }
    }

    return dots;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, animatedStyle]}>
          {generateDots()}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  overlay: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 10,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#666',
    position: 'absolute',
  },
});

export default Touchpad;
