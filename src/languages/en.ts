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
    'Set language of Peasyo': 'Set the language of PeaSyo',
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
    BitrateTips:
      'Note that excessive bitrate may cause video artifacts. If artifacts occur, please reduce the bitrate accordingly',
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
      'Force Peasyo’s USB driver to take over all supported /DualSense controllers (experimental)',
    bind_usb_device_tips:
      'This setting only takes effect for controllers that support XInput or DualSense protocol when connected via wired (OTG).',
    'Force Nexus/PS button to simulate touchpad':
      'Force Nexus/Volume button to simulate touchpad',
    bind_usb_device_force_touchpad_desc:
      'After enabling Android controller support override, force Xbox controller Nexus button or DS controller volume button to simulate touchpad clicks',
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
    Login_PSN_Username:
      'If you cannot open the PSN login page, you can choose to log in directly with your PSN username.',
    Login_with_username: 'Login with username',
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
      'To play remotely, enter the host IP or router’s public IP. Supported formats:\n example.com \n 192.168.1.1 \n 2001:db8:85a3::8a2e:370:7334',
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
    Manager: 'Manage consoles',
    ConsoleEdit: 'Edit consoles',
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
    SwapDpadTitle: 'D-pad Simulate Left Joystick',
    SwapDpadDesc:
      'Simulate the D-pad behavior as the left joystick(left joystick will not working in this mode).',
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
    ExportTips:
      'Due to Android permission restrictions, you can only export to the Download folder, such as Download/peasyo.',
    ImportDesc:
      'If you have a PeaSyo configuration, you can import the configuration file directly without re-registering hosts.',
    DS_test_title: 'DualSense 5 Controller Test',
    DS_test_desc:
      'To test the DualSense 5, ensure that the Android overlay driver is enabled(Settings - Override native gamepad support - Enable) and the DualSense 5 controller is connected via a wired connection.',
    DS_RGB_title: 'Set DS5 Controller LED Strip Color',
    DS_RGB_desc:
      'When the DS5 controller is connected to PeaSyo via USB, you can modify the LED strip color(ensure that the Android overlay driver is enabled(Settings - Override native gamepad support - Enable)).',
    'PSN username': 'PSN Username',
    Login_username_title:
      'You can log in directly using your PSN username (online ID), note that it is not your PSN account.',
    Login_username_tips:
      "Your privacy settings need to allow 'Anyone' to find you in search. Otherwise, login will fail.",
    User_not_found:
      'User not found, please confirm that your PSN username is entered correctly.',
    PSN_username: 'PSN Username',
    Switch_user: 'Switch User',
    'PSN login': 'PSN Login',
    'PSN username login': 'PSN Username Login',
    User_manager_desc1: 'Please select the currently logged-in user.',
    User_manager_desc2:
      'The selected user only affects unregistered consoles; registered consoles are not affected.',
    Delete_user_text: 'Delete user',
    BasesSettings: 'Basic',
    DisplaySettings: 'Display',
    GamepadSettings: 'Gamepad and Vibration',
    SensorSettings: 'Sensor',
    gyroTitle: 'Enable Gyroscope Simulated Joystick',
    gyroDesc: 'Force use of device/controller gyroscope to simulate joystick.',
    gyroTips:
      'Controller gyroscope only supports Android 12+. recommended to use DualSense 5 controller.',
    gyroTypeTitle: 'Gyroscope Trigger Type',
    gyroTypeDesc:
      'Set the gyroscope trigger to activate on L1/L2 press or globally',
    'L2 press': 'L2 Press',
    'L1 press': 'L1 Press',
    Global: 'Global',
    gyroSenTitleX: 'Gyroscope X-axis Sensitivity',
    gyroSenDescX: 'Adjust gyroscope X-axis sensitivity',
    gyroSenTitleY: 'Gyroscope Y-axis Sensitivity',
    gyroSenDescY: 'Adjust gyroscope Y-axis sensitivity',
    Device: 'Device',
    'Controller(DS5)': 'Controller (Recommended DS5)',
    gyroSenInvertTitle: 'Invert Gyroscope Simulated Joystick',
    gyroSenInvertDesc:
      'The gyroscope direction on some devices may be opposite to the actual direction. you can invert the direction here.',
    x_axies: 'X Axis',
    y_axies: 'Y Axis',
    all_axies: 'All Axes',
    show_menu_title: 'Display Quick Menu',
    show_menu_desc:
      'The quick menu is always displayed in the lower right corner of the streaming page.',
    ExitRemoteKb: 'Exit Remote keyboard',
    'Device testing': 'Device testing',
    'Testing current device and controller':
      'Testing current device and controller',
    Rumble1s: 'Rumble1s',
    'Stop rumble': 'Stop rumble',
    ControllerRumble: 'Controller Rumble',
    Refresh: 'Refresh',
    Model: 'Model',
    'Android Version': 'Android Version',
    'API Version': 'API Version',
    'Kernal Version': 'Kernel Version',
    'Webview Version': 'Webview Version',
    'Device rumble': 'Device rumble',
    supported: 'supported',
    unsupported: 'unsupported',
    lowThanAndroid12: 'Below Android 12',
    Controllers: 'Controllers',
    Name: 'Name',
    Details: 'Details',
  },
};
