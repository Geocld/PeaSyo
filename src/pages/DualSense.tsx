import React from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  NativeEventEmitter,
} from 'react-native';
import {Button, Text, Divider} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Svg, {Path} from 'react-native-svg';

import DS5Controller from '../components/DS5Controller';

const eventEmitter = new NativeEventEmitter();

function DsScreen({navigation}) {
  const {t} = useTranslation();
  const usbGpEventListener = React.useRef<any>(undefined);

  const [color1, setColor1] = React.useState('#FF0000');
  const [color2, setColor2] = React.useState('#0000FF');

  React.useEffect(() => {
    usbGpEventListener.current = eventEmitter.addListener(
      'onDsGamepadReport',
      states => {
        console.log('onDsGamepadReport:', states);
      },
    );

    return () => {
      usbGpEventListener.current && usbGpEventListener.current.remove();
    };
  }, [navigation, t]);

  return (
    <ScrollView style={styles.container}>
      <View>
        <Text>123</Text>
        <DS5Controller />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});

export default DsScreen;
