import { throttle } from 'lodash-es'
import { defineStore } from 'pinia'
import { reactive, readonly, ref, watch } from 'vue'

export const useDualSenseStore = defineStore('dualsense', () => {

  const state = ref({
    axes: {
      leftStickX: 0,
      leftStickY: 0,
      rightStickX: 0,
      rightStickY: 0,
      l2: 0,
      r2: 0,
      accelX: 0,
      accelY: 0,
      accelZ: 0,
      gyroX: 0,
      gyroY: 0,
      gyroZ: 0,
    },
    buttons: {
      triangle: false,
      circle: false,
      cross: false,
      square: false,
      dPadUp: false,
      dPadRight: false,
      dPadDown: false,
      dPadLeft: false,
      l1: false,
      l2: false,
      l3: false,
      r1: false,
      r2: false,
      r3: false,
      options: false,
      create: false,
      playStation: false,
      touchPadClick: false,
      mute: false,
    },
    touchpad: {
      touches: []
    }
  })

  const updateState = (detail) => {
    state.value = { ...detail }
  }

  const throttledUpdateState = throttle(updateState, 10)

  const output = reactive({
    micLight: false,
    lightbar: [223, 96, 105],
    playerLight: 0,
    playerLightBrightness: 0,
    motorLeft: 0,
    motorRight: 0,
    rightTriggerEffect: 0,
    leftTriggerEffect: 0,
    rightTriggerEffectData: [],
    leftTriggerEffectData: []
  })

  document.addEventListener('message', (event: any) => {
    try {
      const data = JSON.parse(event.data)
      const { type, value } = data;

      if (type === 'gpStates') {
        throttledUpdateState(value)
      }
      
    } catch (e) {}
  })

  watch(output, (newOutput) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'dsOutput',
          message: JSON.stringify(newOutput)
        })
    );
    }
  })

  return {
    dualsense: {},
    isConnected: ref(true),
    state: ref(state),
    output,
    firmwareVersion: null,
  }

  // const dualsense = new DualSense({
  //   persistCalibration: true,
  // })
  // const isConnected = ref(false)
  // const firmwareVersion = ref<DualSenseFirmwareInfo | null>(null)
  // const state = ref(dualsense.state)
  // const output = reactive(dualsense.output)

  // watch(output, (newOutput) => {
  //   dualsense.output = newOutput
  // })

  // dualsense.addEventListener('connected', ({ detail }) => {
  //   isConnected.value = true
  //   dualsense.getFirmwareVersion().then((version) => {
  //     firmwareVersion.value = version
  //   })
  //   umami?.track('connect', { model: detail.model })
  // })

  // dualsense.addEventListener('disconnected', () => {
  //   isConnected.value = false
  //   umami?.track('disconnect')
  // })

  // const updateState = (detail: DualSenseState) => {
  //   state.value = { ...detail }
  // }

  // const throttledUpdateState = throttle(updateState, 10)

  // dualsense.addEventListener('state-change', ({ detail }) => {
  //   throttledUpdateState(detail)
  // })

  // return {
  //   dualsense,
  //   isConnected,
  //   state: readonly(state),
  //   output,
  //   firmwareVersion,
  // }
})
