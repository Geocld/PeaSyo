export const GAMEPAD_MAPING = {
  A: 96,
  B: 97,
  X: 99,
  Y: 100,
  DPadUp: 19,
  DPadDown: 20,
  DPadLeft: 21,
  DPadRight: 22,
  LeftShoulder: 102,
  RightShoulder: 103,
  LeftThumb: 106,
  RightThumb: 107,
  LeftTrigger: 104,
  RightTrigger: 105,
  Menu: 108,
  View: 109,
  Nexus: 110,
  Touchpad: 0,
};

export const DiscoveryVersions = {
  PS4: '00020020',
  PS5: '00030010',
};

export const DiscoveryPort = {
  PS4: 987,
  PS5: 9302,
};

export enum DeviceStatus {
  STANDBY = 'STANDBY',
  AWAKE = 'AWAKE',
}

export enum DeviceType {
  PS4 = 'PS4',
  PS5 = 'PS5',
}

export const DOMAIN_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
