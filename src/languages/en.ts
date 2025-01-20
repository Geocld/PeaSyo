export default {
  translation: {
    // common
    Loading: 'Loading',
    Consoles: 'Consoles',
    Settings: 'Settings',
    Warning: 'Warning',
    Cancel: 'Cancel',
    Confirm: 'Confirm',
    Save: 'Save',
    Reset: 'Reset',
    Others: 'Others',
    Back: 'Back',
    Select: 'Select',
    Edit: 'Edit',
    Default: 'Default',
    About: 'About',
    Enable: 'Enable',
    Disable: 'Disable',
    Light: 'Light',
    Dark: 'Dark',
    Feedback: 'Feedback and Support',
    Logout: 'Logout',
    Current: 'Current',
    LogoutText: 'Do you want to log out?',
    'Reset all settings to default': 'Reset all settings to default',
    ResetText: 'Do you want to reset all settings?',
    UsbMappingDisable:
      'Gamepad key mapping is temporarily unavailable after overriding the Android driver',
    'Customize virtual buttons': 'Customize virtual buttons',
    'Customize buttons of virtual gamepad':
      'Customize buttons of virtual gamepad',
    'Click on an element to set its size and display':
      '👆Click on an element to set its size and display',
    'Drag elements to adjust their position':
      '✋Drag elements to adjust their position',
    'Name can not be empty': 'Name cannot be empty',
    // settings
    'App language': 'App language',
    'Set language of Peasyo': 'Set the language of Peasyo',
    Theme: 'Theme',
    'Set the app theme to take effect on the next launch':
      'Set the app theme to take effect on the next launch',
    Resolution: 'Resolution',
    ResolutionDesc:
      'Set the streaming resolution, supports switching between 360P/540P/720P/1080P',
    'Video stream format': 'Aspect ratio',
    VideoFormatDesc:
      'If you want the video stream to fill the full screen, you can modify the corresponding ratio here',
    'Aspect ratio': 'Maintain aspect ratio (16:9)',
    Stretch: 'Stretch',
    Zoom: 'Zoom',
    'Stream bitrate': 'Bitrate',
    BitrateDesc:
      'Set the maximum streaming bitrate. Note that the streaming bitrate of PS4/5 is dynamic',
    Auto: 'Auto',
    Custom: 'Custom',
    Codec: 'Video Codec',
    CodecDesc:
      'Set the video playback codec. H264 uses AVC decoding, H265 uses HEVC decoding',
    FPS: 'FPS',
    FPSDesc: 'Set the streaming frame rate',
    'Performance render': 'Performance Rendering',
    PerformanceRenderDesc:
      'Use high-performance video rendering. By default, high-performance rendering is used, but note that streaming will stop when the app is sent to the background. If you need to frequently switch to the background while maintaining streaming, please turn off high-performance rendering mode',
    Sensor: 'Sensor',
    SensorDesc: 'Use device sensors',
    'Invert Sensor': 'Invert Sensor',
    InvertSensorDesc:
      'If you find the sensor direction is reversed in the game, please enable sensor inversion',
    'Show performance': 'Show performance info',
    'Always display the performance panel':
      'Always display the performance panel',
    'Performance show style': 'Performance display style',
    'Setting performance show style':
      'Set performance display style (horizontal/vertical)',
    'Key mapping': 'Key mapping',
    'Mapping key of gamepad': 'Map gamepad keys',
    Rumble: 'Rumble',
    RumbleDesc:
      'If the gamepad supports rumble, you can set whether to enable rumble in-game',
    'Override native Xbox gamepad support':
      'Override native Xbox gamepad support',
    bind_usb_device_description:
      'Force Peasyo’s USB driver to take over all supported Xbox gamepads (experimental)',
    bind_usb_device_tips:
      'This setting only works for gamepads with xinput protocol in wired mode',
    'Rumble intensity': 'Rumble intensity',
    RumbleIntensityDesc: 'Set the controller rumble intensity',
    'Joystick dead zone': 'Joystick dead zone',
    DeadZoneDesc:
      'If the controller drifts, setting a joystick dead zone may provide better results',
    'Joystick edge compensation': 'Joystick edge compensation',
    EdgeDesc:
      'If the controller has an edge dead zone, you can set edge compensation for optimal performance',
    'Short Trigger': 'Short Trigger',
    'Modify the linear trigger action to a short trigger':
      'Modify the linear trigger action to a short trigger',
    'Virtual gamepad': 'Virtual gamepad',
    'Always display the virtual gamepad': 'Always display the virtual gamepad',
    'Virtual Opacity': 'Virtual button opacity',
    'Config opacity of virtual gamepad': 'Set virtual button opacity',
    'Low Latency Mode': 'Low Latency Mode (Wi-Fi)',
    low_latency_mode_description:
      'Use Android’s Wi-Fi performance mode to achieve the best streaming experience. May cause Bluetooth latency on some devices. If you experience Bluetooth latency issues, please disable this mode',
    'Touchpad type': 'Touchpad Type',
    TouchpadTypeDesc:
      'Modify touchpad type, can be set to full-screen touchpad',
    TouchpadTypeTips:
      'When using full-screen mode for touchpad, virtual buttons will be unavailable',
    'Auto check update': 'Auto check updates',
    AutoUpdateDesc: 'Enable or disable automatic update checks for Peasyo',
    TransferDesc:
      'Transfer login information and registration information to a new device',
    'Consoles manager': 'Console Management',
    ConsolesDesc: 'Modify or delete registered consoles',
    ConsoleName: 'Console Name',
    ConsoleType: 'Console Type',
    ConsoleId: 'Console ID',
    RegistedTime: 'Registration Time',
    Host: 'Address',
    NicknameError: 'Console name cannot be empty',
    ConsoleDeleteWarn:
      'Are you sure you want to delete this console? Re-registration will be required after deletion',
    // Home
    Login: 'Login',
    Registry: 'Register',
    NoLogin: 'Not logged in, please login',
    NoRegistry: 'Host not registered, please register',
    EmptyRegistry: 'Clear registered hosts',
    'Login Successful': 'Login successful',
    'Unable to Fetch User Information': 'Unable to fetch user information',
    LoginFailWithAccessTokenIsNull:
      'Login failed, please try again. Access token is null',
    'Get access_token failed': 'Failed to get access token',
    CredentialIsEmpty: 'Credential is empty, please re-register',
    RemoteAddressCannotEmpty: 'Remote address cannot be empty',
    ParseError101:
      'Domain resolution failed (101). Ensure your domain is valid. If using an IPv6 domain, make sure your network supports IPv6.',
    ParseError102:
      'Domain resolution failed (102). Ensure your domain is valid. If using an IPv6 domain, make sure your network supports IPv6.',
    RemoteDesc:
      'To play remotely, enter the host IP or router’s public IP. Supported formats: example.com / 192.168.1.1 / 2001:db8:85a3::8a2e:370:7334',
    RemoteHost: 'Remote address',
    WakeConsole: 'Wake up console',
    WakeDesc:
      'If the console is in sleep mode, do you want to wake it up? Waking up takes about one minute.',
    OnlyConnect: 'Connect only',
    WakeAndConnect: 'Wake and connect',
    Waking: 'Waking...',
    FindConsole: 'Finding console...',
    ConsoleNotFound:
      'Console not found. Please ensure your device and console are on the same network, and the console is in standby or powered on',
    // Regsistry
    RegistTips:
      'Note: Only supports registering PS5 or PS4 (firmware version 8 or above) consoles',
    LookConsole: 'Searching for console',
    HostError: 'Host IP cannot be empty',
    PINError: 'PIN cannot be empty',
    PINLenError: 'Incorrect PIN length',
    TokenisEmpty: 'Token is empty, please re-login',
    RegistrySuccess: 'Registration successful',
    SelectConsoleType: 'Please select console type',
    SelectConsole: 'Please select a console',
    NoConsole: 'No console found, please enter the host IP manually',
    RegistFailed:
      'Registration failed. Please check if the PIN code is correct and verify that the host login account matches the current account',
    // Map
    MapDesc: 'Press the gamepad button to map it to:',
    MapDesc2: 'This window will close automatically after successful mapping',
    // Console
    RegistryTime: 'Regist',
    LocalStream: 'Local stream',
    RemoteStream: 'Remote Stream',
    // Stream
    SurfaceRenderDesc:
      'Currently using performance rendering mode, interface initializing',
    // Transfer
    ExportSuccess: 'Configuration exported successfully',
    ExportFail: 'Configuration export failed',
    ImportSuccess: 'Configuration imported successfully',
    ImportFail: 'Configuration import failed',
    UserCancel: 'User cancelled',
    StorePermission: 'Storage Permission',
    PermissionMsg: 'PeaSyo needs access to your storage',
    AskLater: 'Ask Later',
    NoPermission: 'No Permission',
    ExportSettings: 'Export Settings',
    ImportSettings: 'Import Settings',
    ExportDesc:
      'You can export PeaSyo configuration locally for future configuration recovery and transfer to another device, without the need to re-login or register hosts.',
    ImportDesc:
      'If you have a PeaSyo configuration, you can import the configuration file directly without re-registering hosts.',
  },
};
