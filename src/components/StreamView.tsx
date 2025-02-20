import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  ForwardRefRenderFunction,
} from 'react';
import {
  requireNativeComponent,
  ViewStyle,
  UIManager,
  findNodeHandle,
} from 'react-native';

interface StreamViewProps {
  style?: ViewStyle;
  streamInfo: any;
  onStreamStateChange?: (state: string) => void;
}

interface StreamViewRef {
  startSession: () => void;
  stopSession: () => void;
  requestFocus: () => void;
  pressButton: (buttonMask: number, isPressed: boolean) => void;
  pressTrigger: (name: string, value: number) => void;
  moveStick: (name: string, x: number, y: number) => void;
  sensorStick: (x: number, y: number) => void;
  tap: (isPressed: boolean, nextId: number, touches: any[]) => void;
  touch: (mask: number, nextId: number, touches: any[]) => void;
  getPerformance: () => void;
  usbController: (controllerStates: any) => void;
  usbDsController: (controllerStates: any) => void;
  sleep: () => void;
  startSensor: () => void;
  stopSensor: () => void;
}

const StreamViewNative = requireNativeComponent<StreamViewProps>('StreamView');

const StreamView: ForwardRefRenderFunction<StreamViewRef, StreamViewProps> = (
  {style, streamInfo, onStreamStateChange},
  ref,
) => {
  const streamViewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startSession: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.startSession.toString(),
          [viewId],
        );
      }
    },
    stopSession: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.stopSession.toString(),
          [viewId],
        );
      }
    },
    requestFocus: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.requestFocus.toString(),
          [viewId],
        );
      }
    },
    pressButton: (buttonMask: number, isPressed: boolean) => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.pressButton.toString(),
          [buttonMask, isPressed],
        );
      }
    },
    pressTrigger: (name: string, value: number) => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.pressTrigger.toString(),
          [name, value],
        );
      }
    },
    moveStick: (name: string, x: number, y: number) => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.moveStick.toString(),
          [name, x, y],
        );
      }
    },
    sensorStick: (x: number, y: number) => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.sensorStick.toString(),
          [x, y],
        );
      }
    },
    tap: (isPressed: boolean, nextId: number, touches: any[]) => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.touchpadTap.toString(),
          [isPressed, nextId, ...touches],
        );
      }
    },
    touch: (mask: number, nextId: number, touches: any[]) => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.touchpad.toString(),
          [mask, nextId, ...touches],
        );
      }
    },
    getPerformance: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.performance.toString(),
          [],
        );
      }
    },
    usbController: (states: any) => {
      if (streamViewRef.current) {
        const {
          flags,
          leftTrigger,
          rightTrigger,
          leftStickX,
          leftStickY,
          rightStickX,
          rightStickY,
        } = states;
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.usbController.toString(),
          [
            flags,
            leftStickX,
            leftStickY,
            rightStickX,
            rightStickY,
            leftTrigger,
            rightTrigger,
          ],
        );
      }
    },
    usbDsController: (states: any) => {
      if (streamViewRef.current) {
        const {
          flags,
          leftTrigger,
          rightTrigger,
          leftStickX,
          leftStickY,
          rightStickX,
          rightStickY,
          gyrox,
          gyroy,
          gyroz,
          accelx,
          accely,
          accelz,
          touch0id,
          touch0x,
          touch0y,
          touch1id,
          touch1x,
          touch1y,
        } = states;
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.usbDsController.toString(),
          [
            flags,
            leftStickX,
            leftStickY,
            rightStickX,
            rightStickY,
            leftTrigger,
            rightTrigger,
            gyrox,
            gyroy,
            gyroz,
            accelx,
            accely,
            accelz,
            touch0id,
            touch0x,
            touch0y,
            touch1id,
            touch1x,
            touch1y,
          ],
        );
      }
    },
    sleep: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.gotoBed.toString(),
          [viewId],
        );
      }
    },
    startSensor: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.startSensor.toString(),
          [viewId],
        );
      }
    },
    stopSensor: () => {
      if (streamViewRef.current) {
        const viewId = findNodeHandle(streamViewRef.current);

        UIManager.dispatchViewManagerCommand(
          viewId,
          // @ts-ignore
          UIManager.StreamView.Commands.stopSensor.toString(),
          [viewId],
        );
      }
    },
  }));

  const handleStreamStateChange = (event: any) => {
    const state = event.nativeEvent.state;
    if (onStreamStateChange) {
      onStreamStateChange(state);
    }
  };

  return (
    <StreamViewNative
      ref={streamViewRef}
      style={style}
      streamInfo={streamInfo}
      onStreamStateChange={handleStreamStateChange}
    />
  );
};

export default forwardRef(StreamView);
