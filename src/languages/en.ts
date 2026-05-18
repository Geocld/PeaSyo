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
    Apply: 'Apply',
    Edit: 'Edit',
    Hide: 'Hide',
    Default: 'Default',
    About: 'About',
    Enable: 'Enable',
    Disable: 'Disable',
    Experiment: 'Experimental',
    Light: 'Light',
    Dark: 'Dark',
    'Update Warning': 'Update available',
    Download: 'Download',
    'Downloading update': 'Downloading update...',
    'Update download': 'Downloading update',
    Downloaded: 'Downloaded',
    'Preparing installation': 'Download complete. Opening installer...',
    'Auto install': 'Auto install',
    'Manual download': 'Manual download',
    InstallPermissionRequired:
      'Allow PeaSyo to install unknown apps in system settings, then tap auto install again.',
    AutoInstallFailed:
      'Automatic download and installation failed. Please try manual download.',
    Feedback: 'Feedback and Support',
    Logout: 'Logout',
    Current: 'Current',
    MaxRate: 'Max',
    StandardRate: 'Standard',
    LogoutText: 'Do you want to log out?',
    'Reset all settings to default': 'Reset all settings to default',
    ResetText: 'Do you want to reset all settings?',
    UsbMappingDisable:
      'Gamepad key mapping is temporarily unavailable after overriding the Android driver',
    'Customize virtual buttons': 'Customize virtual buttons',
    'Customize buttons of virtual gamepad':
      'Customize buttons of virtual gamepad',
    'Virtual macro button': 'Virtual macro button',
    'Enable virtual macro button': 'Enable virtual macro button',
    'Virtual macro settings': 'Virtual macro settings',
    'Enable macro button and edit its action sequence':
      'Enable macro button and edit its action sequence',
    'Configure one continuous macro chain. Steps execute from top to bottom when pressing macro button.':
      'Configure one continuous macro chain. Steps execute from top to bottom when pressing macro button.',
    'Enable macro button and edit its action sequence in one place.':
      'Enable macro button and edit its action sequence in one place.',
    'Macro action sequence': 'Macro action sequence',
    'Tap + to add sequence step': 'Tap + to add sequence step',
    'No action steps, tap + to add': 'No action steps, tap + to add',
    'Edit action': 'Edit action',
    'Add action': 'Add action',
    Buttons: 'Buttons',
    Hold: 'Hold',
    Wait: 'Wait',
    Move: 'Move',
    'Loop macro': 'Loop macro',
    'Press macro once to loop, press again to stop':
      'Press macro once to loop, press again to stop',
    'Loop interval': 'Loop interval',
    'Action type': 'Action type',
    'Button macro': 'Button macro',
    'Stick macro': 'Stick macro',
    Stick: 'Stick',
    'Left stick': 'Left stick',
    'Right stick': 'Right stick',
    'Hold duration': 'Hold duration',
    'Move duration': 'Move duration',
    'Wait after action': 'Wait after action',
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
    RemoteResolution: 'Remote resolution',
    RemoteResolutionDesc:
      'Set the remote streaming resolution, supports switching between 360P/540P/720P/1080P',
    'Video stream format': 'Aspect ratio',
    VideoFormatDesc:
      'If you want the video stream to fill the full screen, you can modify the corresponding ratio here',
    'Force portrait stream': 'Force portrait stream',
    ForcePortraitStreamDesc:
      'Keep streaming in portrait. The video uses device width at 16:9',
    'Picture in picture': 'Picture in picture',
    PictureInPictureDesc:
      'Enter Android picture-in-picture and keep video visible when streaming goes to the background',
    'Aspect ratio': 'Maintain aspect ratio (16:9)',
    Stretch: 'Stretch',
    Zoom: 'Zoom',
    'Stream bitrate': 'Bitrate',
    BitrateDesc:
      'Set the maximum streaming bitrate. Note that the streaming bitrate of PS4/5 is dynamic',
    'Remote stream bitrate': 'Remote bitrate',
    RemoteBitrateDesc:
      'Set the maximum remote streaming bitrate. Note that the streaming bitrate of PS4/5 is dynamic',
    BitrateTips:
      'Note that excessive bitrate may cause video artifacts. If artifacts occur, please reduce the bitrate accordingly',
    Auto: 'Auto',
    Custom: 'Custom',
    Codec: 'Video Codec',
    CodecDesc:
      'Set the video playback codec. H264 uses AVC decoding, H265 uses HEVC decoding',
    RemoteCodec: 'Video Codec',
    RemoteCodecDesc:
      'Set the remote video playback codec. H264 uses AVC decoding, H265 uses HEVC decoding',
    FPS: 'FPS',
    FL: 'Frame Loss',
    JT: 'Jitter',
    HL: 'Host',
    FPSDesc: 'Set the streaming frame rate',
    RemoteFPS: 'FPS',
    RemoteFPSDesc: 'Set the remote streaming frame rate',
    'Audio mode': 'Audio mode',
    AudioModeDesc:
      'Choose where stream audio is played on Android. Auto can avoid controller virtual USB audio devices.',
    'System default': 'System default',
    Speaker: 'Speaker',
    'Wired headset': 'Wired headset',
    'Bluetooth headset': 'Bluetooth headset',
    'USB audio': 'USB audio',
    'HDMI audio': 'HDMI audio',
    'Audio sharing mode': 'Audio sharing mode',
    AudioSharingModeDesc:
      'Choose Oboe sharing mode. Shared is more compatible; Exclusive may have lower latency on some devices.',
    'Shared (Recommended)': 'Shared (Recommended)',
    'Exclusive (Low latency)': 'Exclusive (Low latency)',
    'Software volume control': 'Software volume control',
    SoftwareVolumeControlDesc:
      'Show an in-stream menu control for adjusting app audio output volume.',
    'Stream volume': 'Stream volume',
    'Performance render': 'Performance Rendering',
    PerformanceRenderDesc:
      'Use high-performance video rendering. By default, high-performance rendering is used, but note that streaming will stop when the app is sent to the background. If you need to frequently switch to the background while maintaining streaming, please turn off high-performance rendering mode',
    'maximum operating rate': 'Maximum Operating Rate',
    MaxOperatingRateDesc:
      'Set the decoding operating rate. Setting it to the maximum value helps reduce decoding latency, but there may be compatibility issues on some devices. Please enable with caution.',
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
    'Override native gamepad support': 'Override Android gamepad driver',
    bind_usb_device_description:
      "Force PeaSyo's USB driver to take over all supported Xbox / DualSense / Razer Kishi controllers. If you are using a DualSense 5 controller, enabling this option will provide native haptic feedback.",
    bind_usb_device_tips:
      'This setting only takes effect when a supported Xbox / DualSense / Razer Kishi controller is connected via wired OTG.',
    bind_usb_device_guide_entry:
      'Wired OTG and Razer Kishi Controller Guide 👆',
    bind_usb_device_guide_title: 'Wired OTG and Razer Kishi Controller Guide',
    bind_usb_device_guide_hint:
      'Tap to view connection order, permissions, and driver override setup',
    bind_usb_device_guide_switch_on:
      'Enabled. PeaSyo will take over supported wired OTG controllers.',
    bind_usb_device_guide_switch_off:
      'Disabled. Enable it here for haptics or controller takeover.',
    bind_usb_device_guide_case1:
      '1. To experience native DualSense 5 haptics, enable "Override Android gamepad driver", connect your DualSense 5, then start streaming.',
    bind_usb_device_guide_case2:
      '2. If your Android device does not support controller vibration, or you need PeaSyo to take over a supported Xbox / DualSense / Razer Kishi controller, also enable "Override Android gamepad driver", connect the controller, then start streaming.',
    bind_usb_device_guide_case3:
      '3. To use a Razer Kishi controller for near-native haptic feedback, enable driver override and grant the controller permission to PeaSyo instead of Nexus.',
    bind_usb_device_guide_action: 'Enable "Override Android gamepad driver"',
    'Force Nexus/PS button to simulate touchpad':
      'Force Nexus/Volume button to simulate touchpad',
    bind_usb_device_force_touchpad_desc:
      'After enabling the Android gamepad driver override, force the Xbox controller Nexus button or DS controller volume button to simulate touchpad clicks',
    'Rumble intensity': 'Rumble intensity',
    RumbleIntensityDesc: 'Set the controller rumble intensity',
    'Haptic feedback intensity': 'Haptic feedback intensity',
    HapticFeedbackIntensityDesc:
      'Set haptic feedback vibration intensity (audio haptics)',
    HapticStandard: 'Standard',
    'Joystick dead zone': 'Joystick dead zone',
    DeadZoneDesc:
      'If the controller drifts, setting a joystick dead zone may provide better results',
    'Joystick edge compensation': 'Joystick edge compensation',
    EdgeDesc:
      'If the controller has an edge dead zone, you can set edge compensation for optimal performance',
    'Short Trigger': 'Short Trigger',
    ShortTriggerDesc:
      "If you want to convert the controller's analog trigger input to digital trigger input, or if you are using a controller with digital triggers (such as Switch/NS Pro), please enable this option",
    'Modify the linear trigger action to a short trigger':
      'Modify the linear trigger action to a short trigger',
    'Virtual gamepad': 'Virtual gamepad',
    'Always display the virtual gamepad': 'Always display the virtual gamepad',
    'Virtual Opacity': 'Virtual button opacity',
    'Config opacity of virtual gamepad': 'Set virtual button opacity',
    virtual_joystick_title: 'Virtual Joystick Layout',
    virtual_joystick_desc: 'Set the virtual joystick layout to Fixed/Free mode',
    virtual_joystick_tips:
      'In Free mode, the left/right joystick can be operated in blank areas on either side of the screen',
    Fixed: 'Fixed',
    Free: 'Free',
    'Low Latency Mode': 'Low Latency Mode (Wi-Fi)',
    low_latency_mode_description:
      'Use Android’s Wi-Fi performance mode to achieve the best streaming experience. May cause Bluetooth latency on some devices. If you experience Bluetooth latency issues, please disable this mode',
    'Touchpad type': 'Touchpad Type',
    TouchpadTypeDesc:
      'Modify touchpad type, can be set to Fullscreen/Dual touchpad',
    TouchpadTypeTips:
      'When using Fullscreen for touchpad, virtual buttons will be unavailable, Dual mode can only use share/ps/options function keys',
    TouchpadScaleTitle: 'Touchpad Scale',
    TouchpadScaleDesc:
      'If the size of the virtual touchpad does not meet expectations, you can set the touchpad scaling ratio here.',
    TouchpadOffsetTitle: 'Touchpad Position Offset',
    TouchpadOffsetDesc:
      'If the position of the virtual touchpad does not meet expectations, you can set the vertical offset of the touchpad here.',
    TouchpadOffsetTips:
      'This setting is invalid in fullscreen touchpad mode. The value is a percentage relative to the top of the device.',
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
    RemotePlayTitle: 'PSN Remote Play',
    RemotePlayDesc:
      'If you don’t have a public IP or a local network setup, you can connect remotely directly through PSN servers. This requires logging into PSN, and your console must be updated to the latest system version(PS4 is not supported).',
    RemotePlayTips:
      'Automatic remote connection may not work in all network environments, and even if available, multiple attempts may be required.',
    // Home
    Login: 'Login',
    Registry: 'Register',
    NoLogin: 'Not logged in, please login',
    Login_PSN_Username:
      'If you cannot open the PSN login page, you can choose to log in directly with your PSN username/account base64 ID below.',
    Login_with_username: 'Login with username',
    Login_with_account_id: 'Login with account base64 ID',
    Login_issue: 'PROBLEM?',
    ManualLogin_issue_tips:
      'If you encounter login issues such as "Unable to connect to server" during PSN login, you can use the following solutions:',
    ManualLogin_local_stream_tips:
      'If you only need local streaming, PSN login verification is not required. Go back to Home and log in with your PSN ID or Base64 username.',
    ManualLogin_manual_steps:
      'Use manual login: tap the text below to open the login page, or copy the login link. Open it in your browser. After login, the browser will redirect to a redirect page.',
    ManualLogin_open_link: 'Tap to open',
    ManualLogin_redirect_tips:
      'Paste the redirect link into the input box below, then tap Confirm.',
    ManualLogin_redirect_url_label: 'Redirect URL',
    CopyLink: 'Copy link',
    Copied: 'Copied',
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
      'If the console is in sleep mode, you want to wake it up. Waking up takes about one minute.',
    OnlyConnect: 'Connect only',
    WakeAndConnect: 'Wake and connect',
    WakePacketSent: 'Wake packet send',
    Waking: 'Waking...',
    FindConsole: 'Finding console...',
    ConsoleNotFound:
      'Console not found. Please ensure your device and console are on the same network, and the console is in standby or powered on',
    Manager: 'Manage consoles',
    ConsoleEdit: 'Edit consoles',
    AutoRemoteDesc: 'You can remote play via PSN:',
    AutoRemoteGuide:
      "If you don't know how to fill in the following address, you can try using PSN Auto-Connect (Settings - Others - Use PSN Remote Connect)",
    AutoConnect: 'Auto connect',
    // Regsistry
    RegistTips:
      'Note: Supports registering PS5 and all PS4 firmware ranges. PS4 systems below 7.0 require the current account PSN online ID.',
    LookConsole: 'Searching for console',
    HostError: 'Host IP cannot be empty',
    PINError: 'PIN cannot be empty',
    PINLenError: 'Incorrect PIN length',
    TokenisEmpty: 'Token is empty, please re-login',
    LegacyPs4OnlineIdError:
      'PS4 systems below 7.0 require a valid PSN online ID. Please sign in with a normal PSN account and try again.',
    RegistrySuccess: 'Registration successful',
    SelectRegisterType: 'Please select a registration type',
    RegisterTypeLocal: 'Local registration',
    RegisterTypeRemote: 'Remote registration',
    RemoteRegisterTips:
      'Make sure your console is updated, connected to PSN, and turned on or in Rest Mode. This feature may not work in all network environments.',
    RemoteRegisterSummary:
      'Remote registration uses the currently discovered PS5 directly, then completes registration over a PSN remote session without asking you to type the console name manually.',
    RemoteRegisterPs5Only:
      'Remote registration currently only supports the PS5 path.',
    RemoteRegisterConsoleName: 'Console name',
    RemoteRegisterConsoleNameRequired: 'Please enter the console name.',
    RemoteRegisterConsoleRequired:
      'Please select an available PS5 console first.',
    RemoteRegisterFailed:
      'Remote registration failed. Check the console name, PSN sign-in state, and network environment.',
    RemoteRegisterLoginRequiredMessage:
      'Remote registration requires a PSN sign-in. Make sure your console is updated, signed in to PSN, and powered on or in Rest Mode. If your sign-in has expired, please sign in again and retry.',
    RemoteRegisterPinTitle: 'Enter console login PIN',
    RemoteRegisterPinTips:
      'The console requested a login PIN. Check it on the console and enter it here.',
    RemoteRegisterPinIncorrect: 'Incorrect PIN, please try again.',
    SelectConsoleType: 'Please select console type',
    SelectPs4Version: 'Please select the PS4 firmware range',
    SelectConsole: 'Please select a console',
    NoConsole: 'No console found, please enter the host IP manually',
    RegistPs5: 'PS5',
    RegistPs4Ge8: 'PS4 (firmware 8.0 and above)',
    RegistPs4Ge7: 'PS4 (firmware 7.0 - 7.99)',
    RegistPs4Lt7: 'PS4 (firmware below 7.0)',
    LegacyPs4OnlineIdHint:
      'This mode uses the current signed-in account PSN online ID for registration instead of the account ID.',
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
    LocalHostRequiredMessage:
      'Local streaming requires the console LAN IP address. Please open console editing and fill in the local address before starting local streaming.',
    RemoteStream: 'Remote Stream',
    // Stream
    SurfaceRenderDesc:
      'Currently using performance rendering mode, interface initializing',
    'Enable Microphone': 'Enable Microphone',
    'Disconnect and sleep': 'Disconnect and sleep',
    'Microphone Permission': 'Microphone Permission',
    'PeaSyo needs microphone permission to send your voice to the host.':
      'PeaSyo needs microphone permission to send your voice to the host.',
    'Microphone permission denied': 'Microphone permission denied',
    checkingNetworkType: 'Checking Network Type…',
    preparingRemoteSession: 'Preparing Remote Session…',
    linkingYourConsole: 'Linking your console…',
    testingConnection: 'Testing connection…',
    connecting: 'Connecting',
    psnTokenExpired: 'PSN login expired. Please sign in again.',
    PSNConnecting:
      'Connecting to PSN, this process may take a few minutes. Please wait patiently. If there is no response after 5 minutes, please close the app and try again.',
    HolepunchFinished: 'PSN hole punching successful, connecting to console...',
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
    ConfigShareTips:
      'You can also directly share the configuration with other applications.',
    Share: 'Share',
    ImportDesc:
      'If you have a PeaSyo configuration, you can import the configuration file directly without re-registering hosts.',
    DS_test_title: 'DualSense 5 Controller Test',
    DS_test_desc:
      'To test the DualSense 5, ensure that the Android gamepad driver override is enabled (Settings - Override Android gamepad driver - Enable) and the DualSense 5 controller is connected via a wired connection.',
    DS_RGB_title: 'Set DS5 Controller LED Strip Color',
    DS_RGB_desc:
      'When the DS5 controller is connected to PeaSyo via USB, you can modify the LED strip color (ensure that the Android gamepad driver override is enabled: Settings - Override Android gamepad driver - Enable).',
    'PSN username': 'PSN Username',
    Login_username_title:
      'You can log in directly using your PSN username (online ID), note that it is not your PSN account.',
    Login_username_tips:
      "Your privacy settings need to allow 'Anyone' to find you in search. Otherwise, login will fail.",
    Login_base64_title:
      "You can log in directly using your PSN account's base64 ID, which can be obtained through third-party websites (result like: ABCD==).",
    Login_base64_desc:
      'You can look it up through the third-party web app below:',
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
    LocalSettings: 'Local stream',
    RemoteSettings: 'Remote stream',
    AudioSettings: 'Audio',
    GamepadSettings: 'Gamepad and Rumble',
    HapticSettings: 'Haptic feedback',
    vGamepadSettings: 'Virtual controller',
    TouchpadSettings: 'Touchpad',
    SensorSettings: 'Sensor',
    AdvanceSettings: 'Advanced',
    AdvanceSettingsDesc:
      '⚠️If you do not understand the following settings, please do not modify them arbitrarily.',
    Haptic_stable_threshold_title:
      'Haptic Feedback Stability Count (Experimental)',
    Haptic_stable_threshold_desc:
      'Modify PS5 haptic feedback vibration stability count. If default vibration effect is not ideal, adjust this value. Higher values make it less sensitive to sudden vibrations',
    Haptic_change_threshold_title:
      'Haptic Feedback Mutation Threshold (Experimental)',
    Haptic_change_threshold_desc:
      'Adjust the threshold for sudden changes in stable environment. Higher values make it less sensitive to sudden vibrations',
    Haptic_diff_threshold_title:
      'Haptic Feedback Left/Right Difference Threshold (Experimental)',
    Haptic_diff_threshold_desc:
      'Adjust the threshold for left/right signal differences in haptic feedback. Lower values result in more frequent vibrations',
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
    xyInvertTitle: 'Swap Gyroscope X/Y Axis',
    xyInvertDesc:
      'Enable if your device gyroscope X/Y axis directions are reversed',
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
    RazerNativeConfig: 'Razer Native Config',
    RazerNativeConfigDesc:
      'Configure the controller-native deadzone and trigger settings for Kishi Ultra / V3 / V3 Pro. These settings do not sync with the current PeaSyo dead_zone / short_trigger options',
    RazerNativeConfigPageNote:
      'This page writes the controller-native configuration and does not share settings with the current PeaSyo dead_zone / short_trigger options.',
    RazerDeviceStatus: 'Device status',
    RazerDeviceDetected: 'Supported Razer controller detected',
    RazerPermissionGranted: 'USB permission granted',
    RazerPermissionRequired:
      'USB permission is required before reading or writing device settings',
    RazerRequestPermission: 'Request USB Permission',
    RazerRefreshFromDevice: 'Read From Device',
    RazerApplyToDevice: 'Write To Device',
    RazerRgbSyncTitle: 'RGB Sync',
    RazerRgbSyncDescription:
      'When enabled, the Razer controller RGB follows the PS5 stream LED color. When disabled, RGB is turned off completely.',
    RazerRgbSyncEnabled: 'RGB Sync Enabled',
    RazerRgbSyncDisabled: 'RGB Off',
    RazerRgbSyncEnabledHint:
      'The controller now follows the PS5 stream LED color in real time',
    RazerRgbSyncDisabledHint: 'The controller RGB is fully turned off',
    RazerRgbBrightnessTitle: 'RGB brightness',
    RazerRgbBrightnessDescription: 'Adjust the controller lighting brightness.',
    RazerPollingRateTitle: 'Controller polling rate',
    RazerPollingRateDescription:
      'Writes the USB High Speed Polling Period for the Android profile. Available options come from the controller supported-rate query.',
    RazerPollingRateCurrent: 'Current polling rate',
    RazerDeadzoneSection: 'Stick Deadzone',
    RazerLeftStickDeadzone: 'Left stick deadzone',
    RazerRightStickDeadzone: 'Right stick deadzone',
    RazerDeadzonePresetHint: 'Adjust the stick center deadzone.',
    RazerCircularityMode: 'Circularity mode',
    RazerCircularityModeHint:
      'Standard keeps diagonals more pronounced, while Circular makes stick curves rounder.',
    RazerCircularityModeStandard: 'Standard',
    RazerCircularityModeCircular: 'Circular',
    RazerCircularityDeviation: 'Dev',
    RazerCircularityCoverage: 'Cov',
    RazerCircularityReset: 'Clear',
    RazerLeftTrigger: 'L2 Trigger',
    RazerRightTrigger: 'R2 Trigger',
    RazerTriggerMode: 'Current mode',
    RazerTriggerModeAnalog: 'Analog trigger',
    RazerTriggerModeDigital: 'Digital trigger',
    RazerAnalogStart: 'Analog start',
    RazerAnalogEnd: 'Analog end',
    RazerDigitalActuation: 'Digital actuation',
    RazerRapidTrigger: 'Rapid trigger',
    RazerConfigReadSuccess: 'Device configuration loaded',
    RazerConfigApplySuccess: 'Device configuration written',
    RazerConfigPermissionRequested:
      'USB permission was requested. Grant it in the system dialog, then read again.',
    RazerConfigUnsupported:
      'No supported Razer Kishi Ultra / V3 / V3 Pro controller was detected',
    RazerConfigOnlyAndroid: 'This page is only available on Android',
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
    LogsDesc: 'View historical streaming logs',
    LogsTips:
      'PeaSyo retains the 3 most recent streaming logs. To export a streaming log, click the share button on the right side of the filename.',
    LogVerboseTitle: 'Enable verbose logging',
    LogVerboseDesc:
      'Records complete streaming logs. This may significantly increase log file size and could potentially impact streaming performance. Do not enable during regular gameplay.',
    WiFiPerformanceModeTitle: 'WiFi Low Latency Mode',
    WiFiPerformanceModeDesc:
      'Enabling this mode can reduce WiFi connection latency and improve stability, but may increase Bluetooth connection latency.',
    GamepadFeedbackIntervalTitle: 'Gamepad Input Min Interval (Refresh Rate)',
    GamepadFeedbackIntervalDesc:
      'Adjust gamepad input data sending frequency. Maintains smart adaptive mechanism, only configures minimum refresh interval. Higher frequency provides faster response but consumes more resources.',
    GamepadFeedbackIntervalUltra: 'Ultra (3ms)',
    GamepadFeedbackIntervalHigh: 'High (5ms)',
    GamepadFeedbackIntervalStandard: 'Standard (8ms, Recommended)',
    GamepadFeedbackIntervalEco: 'Eco (16ms)',
    'Auto toggle hold buttons': 'Auto toggle hold buttons',
    'Select what buttons become toggle holdable':
      'Select what buttons become toggle holdable',
    HoldButtonsSettingsDesc:
      'The auto toggle hold buttons feature allows you to automatically keep a button pressed when you hold it down, until you click the button again. This is useful for game scenarios that require continuous button presses, such as acceleration in racing games or firing in shooting games.',
    'Hold Buttons': 'Hold Buttons',
    History: 'History',
    HistoryTitle: 'Update histories',
    HistoryDesc: 'View update histories of PeaSyo',
    FSRTitle: 'Super Resolution (AMD FSR 1.0)',
    FSRDesc:
      'Enable AMD FSR 1.0 super resolution technology, which is an experimental feature that may have compatibility or stability issues. It is recommended for use on high-performance devices',
    SmartFrameGenerationTitle: 'Smart frame generation',
    SmartFrameGenerationDesc:
      'Use smart frame generation to interpolate some game video streams for smoother results. Note that not all devices are supported.\nTip: If the current game only runs at 30 FPS, setting the stream to 30 FPS usually gives the best result.',
    SmartFrameRecoveryTitle: 'Smart frame recovery (Bitstream parsing)',
    SmartFrameRecoveryDesc:
      'Analyzes incoming video frames and repairs missing frame references during network hiccups, reducing stutter, visual glitches, and freezes. Uses a little more CPU and can be disabled on very stable networks.',
    frame_pacing_title: 'Video frame pacing',
    frame_pacing_desc: 'Specify how to balance video latency and smoothness',
    latency: 'Prefer lowest latency',
    balanced: 'Balanced',
    'cap-fps': 'Balanced with FPS limit',
    smoothness: 'Prefer smoothest video (may significantly increase latency)',
  },
};
