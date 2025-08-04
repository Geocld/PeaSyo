export default {
  translation: {
    // common
    Loading: 'Cargando',
    Consoles: 'Consolas',
    Settings: 'Configuraciones',
    Warning: 'Advertencia',
    Cancel: 'Cancelar',
    Confirm: 'Confirmar',
    Save: 'Guardar',
    Reset: 'Restablecer',
    Others: 'Otros',
    Back: 'Atrás',
    Select: 'Seleccionar',
    Apply: 'Aplicar',
    Edit: 'Editar',
    Default: 'Predeterminado',
    About: 'Acerca de',
    Enable: 'Habilitar',
    Disable: 'Deshabilitar',
    Light: 'Claro',
    Dark: 'Oscuro',
    Feedback: 'Comentarios y soporte',
    Logout: 'Cerrar sesión',
    Current: 'Actual',
    LogoutText: '¿Deseas cerrar sesión?',
    'Reset all settings to default':
      'Restablecer todas las configuraciones a los valores predeterminados',
    ResetText: '¿Deseas restablecer todas las configuraciones?',
    UsbMappingDisable:
      'La asignación de teclas del gamepad no está disponible temporalmente después de anular el controlador de Android',
    'Customize virtual buttons': 'Personalizar botones virtuales',
    'Customize buttons of virtual gamepad':
      'Personalizar los botones del gamepad virtual',
    'Click on an element to set its size and display':
      '👆Haz clic en un elemento para ajustar su tamaño y visibilidad',
    'Drag elements to adjust their position':
      '✋Arrastra los elementos para ajustar su posición',
    'Name can not be empty': 'El nombre no puede estar vacío',
    // settings
    'App language': 'Idioma de la aplicación',
    'Set language of Peasyo': 'Establecer el idioma de PeaSyo',
    Theme: 'Tema',
    'Set the app theme to take effect on the next launch':
      'Establecer el tema de la aplicación para que se aplique en el próximo inicio',
    Resolution: 'Resolución',
    ResolutionDesc:
      'Establecer la resolución de transmisión, admite cambiar entre 360P/540P/720P/1080P',
    RemoteResolution: 'Resolución remota',
    RemoteResolutionDesc:
      'Establecer la resolución de transmisión remota, admite cambiar entre 360P/540P/720P/1080P',
    'Video stream format': 'Formato de transmisión de video',
    VideoFormatDesc:
      'Si deseas que el video se ajuste a pantalla completa, puedes modificar la proporción correspondiente aquí',
    'Aspect ratio': 'Mantener proporción de aspecto (16:9)',
    Stretch: 'Estirar',
    Zoom: 'Zoom',
    'Stream bitrate': 'Tasa de bits',
    BitrateDesc:
      'Establecer la tasa máxima de bits de transmisión. Ten en cuenta que la tasa de bits de transmisión de PS4/5 es dinámica',
    'Remote stream bitrate': 'Tasa de bits remota',
    RemoteBitrateDesc:
      'Establecer la tasa máxima de bits de transmisión remota. Ten en cuenta que la tasa de bits de transmisión de PS4/5 es dinámica',
    BitrateTips:
      'Ten en cuenta que una tasa de bits excesiva puede causar artefactos en el video. Si ocurren artefactos, reduce la tasa de bits según corresponda',
    Auto: 'Automático',
    Custom: 'Personalizado',
    Codec: 'Códec de video',
    CodecDesc:
      'Establecer el códec de reproducción de video. H264 utiliza decodificación AVC, H265 utiliza decodificación HEVC',
    RemoteCodec: 'Códec de video remoto',
    RemoteCodecDesc:
      'Establecer el códec de reproducción de video remoto. H264 utiliza decodificación AVC, H265 utiliza decodificación HEVC',
    FPS: 'FPS',
    FPSDesc: 'Establecer la tasa de fotogramas de transmisión',
    RemoteFPS: 'FPS remoto',
    RemoteFPSDesc: 'Establecer la tasa de fotogramas de transmisión remota',
    'Performance render': 'Renderizado de rendimiento',
    PerformanceRenderDesc:
      'Usar renderizado de video de alto rendimiento. Por defecto, se utiliza renderizado de alto rendimiento, pero ten en cuenta que la transmisión se detendrá si la aplicación se envía al fondo. Si necesitas cambiar frecuentemente al fondo mientras mantienes la transmisión, desactiva el modo de renderizado de alto rendimiento',
    Sensor: 'Sensor',
    SensorDesc: 'Usar sensores del dispositivo',
    'Invert Sensor': 'Invertir sensor',
    InvertSensorDesc:
      'Si encuentras que la dirección del sensor está invertida en el juego, habilita la inversión del sensor',
    'Show performance': 'Mostrar información de rendimiento',
    'Always display the performance panel':
      'Mostrar siempre el panel de rendimiento',
    'Performance show style': 'Estilo de visualización de rendimiento',
    'Setting performance show style':
      'Establecer el estilo de visualización de rendimiento (horizontal/vertical)',
    'Key mapping': 'Asignación de teclas',
    'Mapping key of gamepad': 'Asignar teclas del gamepad',
    Rumble: 'Vibración',
    RumbleDesc:
      'Si el gamepad admite vibración, puedes configurar si habilitarla en el juego',
    'Override native Xbox gamepad support':
      'Anular soporte nativo del gamepad de Xbox',
    bind_usb_device_description:
      'Forzar el controlador USB de Peasyo para tomar control de todos los controladores compatibles / DualSense (experimental)',
    bind_usb_device_tips:
      'Esta configuración solo se aplica a controladores que admiten el protocolo XInput o DualSense cuando están conectados por cable (OTG).',
    'Force Nexus/PS button to simulate touchpad':
      'Forzar el botón Nexus/Volumen para simular el panel táctil',
    bind_usb_device_force_touchpad_desc:
      'Después de habilitar la anulación del soporte del controlador de Android, fuerza el botón Nexus del controlador Xbox o el botón de volumen del controlador DualSense para simular clics en el panel táctil',
    'Rumble intensity': 'Intensidad de vibración',
    RumbleIntensityDesc:
      'Establecer la intensidad de vibración del controlador',
    'Joystick dead zone': 'Zona muerta del joystick',
    DeadZoneDesc:
      'Si el controlador tiene deriva, configurar una zona muerta del joystick puede proporcionar mejores resultados',
    'Joystick edge compensation': 'Compensación de borde del joystick',
    EdgeDesc:
      'Si el controlador tiene una zona muerta en el borde, puedes configurar compensación de borde para un rendimiento óptimo',
    'Short Trigger': 'Gatillo corto',
    ShortTriggerDesc:
      'Si deseas convertir la entrada analógica del gatillo del controlador en entrada digital, o si estás utilizando un controlador con gatillos digitales (como Switch/NS Pro), habilita esta opción',
    'Modify the linear trigger action to a short trigger':
      'Modificar la acción del gatillo lineal a un gatillo corto',
    'Virtual gamepad': 'Gamepad virtual',
    'Always display the virtual gamepad': 'Mostrar siempre el gamepad virtual',
    'Virtual Opacity': 'Opacidad de los botones virtuales',
    'Config opacity of virtual gamepad':
      'Configurar la opacidad de los botones virtuales',
    virtual_joystick_title: 'Diseño del joystick virtual',
    virtual_joystick_desc:
      'Establecer el diseño del joystick virtual a modo fijo/libre',
    virtual_joystick_tips:
      'En el modo libre, el joystick izquierdo/derecho puede operar en áreas vacías de ambos lados de la pantalla',
    Fixed: 'Fijo',
    Free: 'Libre',
    'Low Latency Mode': 'Modo de baja latencia (Wi-Fi)',
    low_latency_mode_description:
      'Usar el modo de rendimiento Wi-Fi de Android para lograr la mejor experiencia de transmisión. Puede causar latencia en Bluetooth en algunos dispositivos. Si experimentas problemas de latencia Bluetooth, desactiva este modo',
    'Touchpad type': 'Tipo de panel táctil',
    TouchpadTypeDesc:
      'Modificar el tipo de panel táctil, puede configurarse como Pantalla completa/Doble panel táctil',
    TouchpadTypeTips:
      'Al usar Pantalla completa/Doble para el panel táctil, los botones virtuales no estarán disponibles',
    TouchpadScaleTitle: 'Escala del panel táctil',
    TouchpadScaleDesc:
      'Si el tamaño del panel táctil virtual no cumple con las expectativas, puedes configurar la proporción de escala aquí.',
    TouchpadOffsetTitle: 'Desplazamiento de posición del panel táctil',
    TouchpadOffsetDesc:
      'Si la posición del panel táctil virtual no cumple con las expectativas, puedes configurar el desplazamiento vertical del panel táctil aquí.',
    TouchpadOffsetTips:
      'Esta configuración no es válida en el modo de panel táctil de pantalla completa. El valor es un porcentaje relativo a la parte superior del dispositivo.',
    'Auto check update': 'Verificación automática de actualizaciones',
    AutoUpdateDesc:
      'Habilitar o deshabilitar la verificación automática de actualizaciones para Peasyo',
    TransferDesc:
      'Transferir información de inicio de sesión e información de registro a un nuevo dispositivo',
    'Consoles manager': 'Gestión de consolas',
    ConsolesDesc: 'Modificar o eliminar consolas registradas',
    ConsoleName: 'Nombre de la consola',
    ConsoleType: 'Tipo de consola',
    ConsoleId: 'ID de la consola',
    RegistedTime: 'Fecha de registro',
    Host: 'Dirección',
    NicknameError: 'El nombre de la consola no puede estar vacío',
    ConsoleDeleteWarn:
      '¿Estás seguro de que deseas eliminar esta consola? Será necesario registrarla nuevamente después de eliminarla',
    RemotePlayTitle: 'PSN Remote Play (Experimental)',
    RemotePlayDesc:
      'Si no tienes una IP pública o una configuración de red local, puedes conectarte remotamente directamente a través de los servidores de PSN. Esto requiere iniciar sesión en PSN, y tu consola debe estar actualizada a la última versión del sistema (PS4 no es compatible).',
    RemotePlayTips:
      'La conexión remota automática puede no funcionar en todos los entornos de red, e incluso si está disponible, puede requerir varios intentos.',
    // Home
    Login: 'Iniciar sesión',
    Registry: 'Registrar',
    NoLogin: 'No has iniciado sesión, por favor inicia sesión',
    Login_PSN_Username:
      'Si no puedes abrir la página de inicio de sesión de PSN, puedes optar por iniciar sesión directamente con tu nombre de usuario de PSN.',
    Login_with_username: 'Iniciar sesión con nombre de usuario',
    NoRegistry: 'Host no registrado, por favor regístrate',
    EmptyRegistry: 'Eliminar hosts registrados',
    'Login Successful': 'Inicio de sesión exitoso',
    'Unable to Fetch User Information':
      'No se pudo obtener la información del usuario',
    LoginFailWithAccessTokenIsNull:
      'Error de inicio de sesión, por favor intenta de nuevo. El token de acceso es nulo',
    'Get access_token failed': 'Error al obtener el token de acceso',
    CredentialIsEmpty:
      'Las credenciales están vacías, por favor regístrate nuevamente',
    RemoteAddressCannotEmpty: 'La dirección remota no puede estar vacía',
    ParseError101:
      'Error en la resolución de dominio (101). Asegúrate de que tu dominio sea válido. Si estás utilizando un dominio IPv6, verifica que tu red sea compatible con IPv6.',
    ParseError102:
      'Error en la resolución de dominio (102). Asegúrate de que tu dominio sea válido. Si estás utilizando un dominio IPv6, verifica que tu red sea compatible con IPv6.',
    RemoteDesc:
      'Para jugar de forma remota, ingresa la IP del host o la IP pública del router. Formatos compatibles:\n example.com \n 192.168.1.1 \n 2001:db8:85a3::8a2e:370:7334',
    RemoteHost: 'Dirección remota',
    WakeConsole: 'Activar consola',
    WakeDesc:
      'Si la consola está en modo de suspensión, ¿quieres activarla? Activarla tardará aproximadamente un minuto.',
    OnlyConnect: 'Solo conectar',
    WakeAndConnect: 'Activar y conectar',
    Waking: 'Activando...',
    FindConsole: 'Buscando consola...',
    ConsoleNotFound:
      'Consola no encontrada. Por favor asegúrate de que tu dispositivo y consola estén en la misma red, y que la consola esté en modo de espera o encendida',
    Manager: 'Gestionar consolas',
    ConsoleEdit: 'Editar consolas',
    AutoRemoteDesc: 'Puedes jugar de forma remota a través de PSN:',
    AutoRemoteGuide:
      'Si no sabes cómo completar la siguiente dirección, puedes intentar usar la conexión automática de PSN (Configuración - Otros - Usar conexión remota de PSN)',
    AutoConnect: 'conexión automática',
    // Registry
    RegistTips:
      'Nota: Solo se admite registrar consolas PS5 o PS4 (versión de firmware 8 o superior)',
    LookConsole: 'Buscando consola',
    HostError: 'La IP del host no puede estar vacía',
    PINError: 'El PIN no puede estar vacío',
    PINLenError: 'Longitud del PIN incorrecta',
    TokenisEmpty: 'El token está vacío, por favor inicia sesión nuevamente',
    RegistrySuccess: 'Registro exitoso',
    SelectConsoleType: 'Por favor selecciona el tipo de consola',
    SelectConsole: 'Por favor selecciona una consola',
    NoConsole:
      'No se encontró ninguna consola, por favor ingresa la IP del host manualmente',
    RegistFailed:
      'Error de registro. Por favor verifica si el código PIN es correcto y asegúrate de que la cuenta de inicio de sesión del host coincida con la cuenta actual',
    SwapDpadTitle: 'D-pad simula el joystick izquierdo',
    SwapDpadDesc:
      'Simula el comportamiento del D-pad como joystick izquierdo (el joystick izquierdo no funcionará en este modo).',
    // Map
    MapDesc: 'Presiona el botón del gamepad para asignarlo a:',
    MapDesc2:
      'Esta ventana se cerrará automáticamente después de una asignación exitosa',
    // Console
    RegistryTime: 'Registro',
    LocalStream: 'Transmisión local',
    RemoteStream: 'Transmisión remota',
    // Stream
    SurfaceRenderDesc:
      'Actualmente usando el modo de renderizado de rendimiento, inicializando la interfaz',
    PSNConnecting:
      'Conectando a PSN, este proceso puede tardar unos minutos. Por favor espera pacientemente. Si no hay respuesta después de 3 minutos, cierra la aplicación e intenta nuevamente.',
    HolepunchFinished: 'Perforación de PSN exitosa, conectando a la consola...',
    // Transfer
    ExportSuccess: 'Configuración exportada con éxito',
    ExportFail: 'Error al exportar la configuración',
    ImportSuccess: 'Configuración importada con éxito',
    ImportFail: 'Error al importar la configuración',
    UserCancel: 'Usuario canceló',
    StorePermission: 'Permiso de almacenamiento',
    PermissionMsg: 'PeaSyo necesita acceso a tu almacenamiento',
    AskLater: 'Preguntar más tarde',
    NoPermission: 'Sin permiso',
    ExportSettings: 'Exportar configuración',
    ImportSettings: 'Importar configuración',
    ExportDesc:
      'Puedes exportar la configuración de PeaSyo localmente para recuperación futura y transferirla a otro dispositivo sin necesidad de iniciar sesión nuevamente o registrar hosts.',
    ExportTips:
      'Debido a las restricciones de permisos en Android, solo puedes exportar a la carpeta de Descargas, como Download/peasyo.',
    ConfigShareTips:
      'También puedes compartir directamente la configuración con otras aplicaciones.',
    Share: 'Compartir',
    ImportDesc:
      'Si tienes una configuración de PeaSyo, puedes importar directamente el archivo de configuración sin necesidad de registrar los hosts nuevamente.',
    DS_test_title: 'Prueba del controlador DualSense 5',
    DS_test_desc:
      'Para probar el DualSense 5, asegúrate de que el controlador de superposición de Android esté habilitado (Configuración - Anular soporte nativo del gamepad - Habilitar) y que el controlador DualSense 5 esté conectado mediante una conexión por cable.',
    DS_RGB_title: 'Configurar el color de la tira LED del controlador DS5',
    DS_RGB_desc:
      'Cuando el controlador DS5 está conectado a PeaSyo a través de USB, puedes modificar el color de la tira LED (asegúrate de que el controlador de superposición de Android esté habilitado (Configuración - Anular soporte nativo del gamepad - Habilitar)).',
    'PSN username': 'Nombre de usuario de PSN',
    Login_username_title:
      'Puedes iniciar sesión directamente utilizando tu nombre de usuario de PSN (ID en línea), ten en cuenta que no es tu cuenta de PSN.',
    Login_username_tips:
      "Tu configuración de privacidad debe permitir que 'Cualquiera' te encuentre en la búsqueda. De lo contrario, el inicio de sesión fallará.",
    User_not_found:
      'Usuario no encontrado, por favor confirma que tu nombre de usuario de PSN está ingresado correctamente.',
    PSN_username: 'Nombre de usuario de PSN',
    Switch_user: 'Cambiar usuario',
    'PSN login': 'Inicio de sesión de PSN',
    'PSN username login': 'Inicio de sesión con nombre de usuario de PSN',
    User_manager_desc1:
      'Por favor selecciona el usuario que ha iniciado sesión actualmente.',
    User_manager_desc2:
      'El usuario seleccionado solo afecta a las consolas no registradas; las consolas registradas no se ven afectadas.',
    Delete_user_text: 'Eliminar usuario',
    BasesSettings: 'Básico',
    DisplaySettings: 'Pantalla',
    LocalSettings: 'Transmisión local',
    RemoteSettings: 'Transmisión remota',
    GamepadSettings: 'Gamepad y Vibración',
    TouchpadSettings: 'Panel táctil',
    SensorSettings: 'Sensor',
    AdvanceSettings: 'Avanzado',
    AdvanceSettingsDesc:
      '⚠️Si no entiendes las siguientes configuraciones, por favor no las modifiques arbitrariamente.',
    Haptic_stable_threshold_title:
      'Conteo de estabilidad de retroalimentación háptica (Experimental)',
    Haptic_stable_threshold_desc:
      'Modifica el conteo de estabilidad de la vibración de retroalimentación háptica de PS5. Si el efecto de vibración predeterminado no es ideal, ajusta este valor. Valores más altos lo hacen menos sensible a vibraciones repentinas.',
    Haptic_change_threshold_title:
      'Umbral de mutación de retroalimentación háptica (Experimental)',
    Haptic_change_threshold_desc:
      'Ajusta el umbral para cambios repentinos en un entorno estable. Valores más altos lo hacen menos sensible a vibraciones repentinas.',
    Haptic_diff_threshold_title:
      'Umbral de diferencia izquierda/derecha en retroalimentación háptica (Experimental)',
    Haptic_diff_threshold_desc:
      'Ajusta el umbral para las diferencias de señal izquierda/derecha en la retroalimentación háptica. Valores más bajos resultan en vibraciones más frecuentes.',
    gyroTitle: 'Habilitar joystick simulado por giroscopio',
    gyroDesc:
      'Forzar el uso del giroscopio del dispositivo/controlador para simular el joystick.',
    gyroTips:
      'El giroscopio del controlador solo es compatible con Android 12+. Se recomienda usar el controlador DualSense 5.',
    gyroTypeTitle: 'Tipo de activación del giroscopio',
    gyroTypeDesc:
      'Configura el gatillo del giroscopio para activarse al presionar L1/L2 o de forma global.',
    'L2 press': 'Presión L2',
    'L1 press': 'Presión L1',
    Global: 'Global',
    gyroSenTitleX: 'Sensibilidad del eje X del giroscopio',
    gyroSenDescX: 'Ajusta la sensibilidad del eje X del giroscopio',
    gyroSenTitleY: 'Sensibilidad del eje Y del giroscopio',
    gyroSenDescY: 'Ajusta la sensibilidad del eje Y del giroscopio',
    Device: 'Dispositivo',
    'Controller(DS5)': 'Controlador (Recomendado DS5)',
    gyroSenInvertTitle: 'Invertir joystick simulado por giroscopio',
    gyroSenInvertDesc:
      'La dirección del giroscopio en algunos dispositivos puede ser opuesta a la dirección real. Puedes invertir la dirección aquí.',
    x_axies: 'Eje X',
    y_axies: 'Eje Y',
    all_axies: 'Todos los ejes',
    xyInvertTitle: 'Intercambiar ejes X/Y del giroscopio',
    xyInvertDesc:
      'Habilita esta opción si las direcciones de los ejes X/Y del giroscopio de tu dispositivo están invertidas.',
    show_menu_title: 'Mostrar menú rápido',
    show_menu_desc:
      'El menú rápido siempre se muestra en la esquina inferior derecha de la página de transmisión.',
    ExitRemoteKb: 'Salir del teclado remoto',
    'Device testing': 'Prueba de dispositivo',
    'Testing current device and controller':
      'Probando el dispositivo y controlador actuales',
    Rumble1s: 'Vibración 1s',
    'Stop rumble': 'Detener vibración',
    ControllerRumble: 'Vibración del controlador',
    Refresh: 'Actualizar',
    Model: 'Modelo',
    'Android Version': 'Versión de Android',
    'API Version': 'Versión de API',
    'Kernal Version': 'Versión del kernel',
    'Webview Version': 'Versión de Webview',
    'Device rumble': 'Vibración del dispositivo',
    supported: 'compatible',
    unsupported: 'no compatible',
    lowThanAndroid12: 'Inferior a Android 12',
    Controllers: 'Controladores',
    Name: 'Nombre',
    Details: 'Detalles',
    LogsDesc: 'Ver registros históricos de transmisión',
    LogsTips:
      'PeaSyo conserva los 3 registros de transmisión más recientes. Para exportar un registro de transmisión, haz clic en el botón de compartir en el lado derecho del nombre del archivo.',
    LogVerboseTitle: 'Habilitar registro detallado',
    LogVerboseDesc:
      'Registra registros completos de transmisión. Esto puede aumentar significativamente el tamaño del archivo de registro y potencialmente afectar el rendimiento de la transmisión. No lo habilites durante el juego habitual.',
  },
};
