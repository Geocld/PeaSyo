import React from 'react';
import {StyleSheet, View, NativeModules} from 'react-native';
import {Text} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {getSettings} from '../store/settingStore';

type Props = {
  resolution: string;
  performance: any;
};

const {BatteryModule} = NativeModules;

const PerfPanel: React.FC<Props> = ({resolution = '', performance = {}}) => {
  const {t} = useTranslation();
  const settings = getSettings();
  const [battery, setBattery] = React.useState(100);
  const batteryInterval = React.useRef<any>(null);

  React.useEffect(() => {
    const getBattery = () => {
      BatteryModule.getBatteryLevel()
        .then(level => {
          if (level) {
            setBattery(Number(level));
          } else {
            setBattery(-1);
          }
        })
        .catch(e => {
          console.log(e);
        });
    };
    getBattery();

    // Catch battery every 2 mins
    batteryInterval.current = setInterval(getBattery, 2 * 60 * 1000);

    return () => {
      batteryInterval.current && clearInterval(batteryInterval.current);
    };
  }, []);

  const isHorizon = settings.performance_style;
  const codec = settings.codec.indexOf('H265') > -1 ? 'HEVC' : 'AVC';

  // const computedRtt = (value: number | undefined): string => {
  //   if (value === undefined) {
  //     return '-1';
  //   }
  //   return Math.round(value) + 'ms';
  // };

  const computedBitrate = (value: number | undefined): string => {
    if (value === undefined) {
      return '-1';
    }
    return (value / 10).toFixed(1) + 'M/s';
  };

  const computedPl = (value: number | undefined): string => {
    if (value === undefined) {
      return '-1';
    }
    return (value * 100).toFixed(2) + '%';
  };

  const computedFps = (value: number | undefined): string => {
    if (value === undefined) {
      return '-1';
    }
    return value.toFixed(1);
  };

  const computedDt = (value: number | undefined): string => {
    if (value === undefined) {
      return '-1';
    }
    return value.toFixed(2) + 'ms';
  };

  const renderBattery = (level: number) => {
    if (level < 20) {
      return `🪫: ${level}%`;
    } else {
      return `🔋: ${level}%`;
    }
  };

  return (
    <View style={isHorizon ? styles.containerH : styles.containerV}>
      <View style={isHorizon ? styles.wrapperH : styles.wrapperV}>
        <View>
          <Text style={styles.text}>
            {resolution || '-1'} {isHorizon ? '| ' : ''}{' '}
          </Text>
        </View>
        {/* <View>
          <Text style={styles.text}>
            {t('RTT')}: {computedRtt(performance.rtt)} {isHorizon ? '| ' : ''}
          </Text>
        </View> */}
        <View>
          <Text style={styles.text}>
            {t('WD')}: {computedBitrate(performance.bitrate)}{' '}
            {isHorizon ? '| ' : ''}
          </Text>
        </View>
        <View>
          <Text style={styles.text}>
            {t('PL')}: {computedPl(performance.packetLoss)}{' '}
            {isHorizon ? '| ' : ''}
          </Text>
        </View>
        {/* <View>
          <Text style={styles.text}>
            {t('FPS')}: {computedFps(performance.fps)} {isHorizon ? '| ' : ''}
          </Text>
        </View> */}
        <View>
          <Text style={styles.text}>
            {t('DT')}: {computedDt(performance.decodeTime)} ({codec})
            {isHorizon ? ' | ' : ''}
          </Text>
        </View>
        <View>
          <Text style={styles.text}>{renderBattery(battery)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerH: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 5,
  },
  wrapperH: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 2,
    flexDirection: 'row',
  },
  containerV: {
    flex: 1,
    justifyContent: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
    padding: 5,
  },
  wrapperV: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 2,
  },
  text: {
    fontSize: 12,
    color: '#fff',
  },
});

export default PerfPanel;
