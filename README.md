<p align="center">
  <a href="https://github.com/Geocld/PeaSyo">
    <img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/logo.png" width="100">
  </a>
</p>
<p align="center">
  <a href="https://github.com/Geocld/PeaSyo">
    <img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/logo-text.png" width="300">
  </a>
</p>

<p align="center">
  Open-source Android remote play client for PlayStation.
</p>

**English** | [中文](./README.zh_CN.md)

## Intro

PeaSyo, also known as Pixiu, is a PS4/5 streaming application for Android that supports remote wake-up, remote streaming, button mapping, controller vibration, and other rich features. You can play your PS anywhere using your phone, tablet, or handheld device.

> DISCLAIMER: PeaSyo is not affiliated with Sony, PlayStation. All rights and trademarks are property of their respective owners.

> Notice: PeaSyo is only compatible with PS4 systems running firmware version 8.0 or higher

## Features

- Support for multiple console registration
- Support for local and remote streaming
- Remote play via PSN
- Up to 1080P resolution with HDR support
- Support gamepad vibration
- Support for button mapping
- Streaming performance monitoring
- Remote wakeup and standby
- DualSense 5 adaptive triggers (requires custom Android driver + OTG wired connection)
- Complete DualSense 5 controller testing(Great inspired by [daidr/dualsense-tester](https://github.com/daidr/dualsense-tester))

<img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/game.jpg" width="400" />
<img src="https://github.com/Geocld/PeaSyo/blob/main/images/home.jpg" width="400" /><img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/settings.jpg" width="400" />
<img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/ds5-test.jpg" width="400" />

## Wired Controller Usage
Due to limitations in the Android kernel drivers, not all Android devices support controller vibration. Additionally, if you are using the DualSense 5 controller and wish to utilize the adaptive triggers, PeaSyo has built-in support for Xbox 360, Xbox Series X/S, and DualSense 5 controllers. When the controller is connected to the Android device via a wired connection, it fully supports vibration and adaptive trigger functions. The specific usage is as follows:

1. PeaSyo - Settings - Controller and Vibration - Override Android Controller Support - Enable
2. Connect the Xbox/DualSense 5 controller to the Android device via a wired connection.
3. A pop-up will appear asking for USB access to the device; click "OK," and PeaSyo will enter the built-in controller driver mode.

> Notice: You must connect controller before streaming, or PeaSyo can not recognize controller.


## Next plans
PeaSyo is undergoing a major refactoring based on [Chiaki](https://git.sr.ht/~thestr4ng3r/chiaki)'s connection protocol, with the next phase planning to rewrite [Chiaki](https://git.sr.ht/~thestr4ng3r/chiaki)'s original C implementation in Rust.

## Local Development

### Requirements
- [React Native](https://reactnative.dev/) >= 0.74
- [NodeJs](https://nodejs.org/) >= 20
- [Yarn](https://yarnpkg.com/) >= 1.22

### Steps to get up and running

Clone the repository:

```
git clone https://github.com/Geocld/PeaSyo
cd PeaSyo
```

Install dependencies:

```
yarn
```

Run development build:

```
npm run android
```

## LICENSE
PeaSyo strictly follows the [AGPL v3 License]((./LICENSE)). If other projects reference or use implementations from this project, please strictly comply with this license.
