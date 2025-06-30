import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Card, Text, Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {SvgXml} from 'react-native-svg';
import dayjs from 'dayjs';
import {getSettings} from '../store/settingStore';
import icons from '../common/svg';

const ConsoleItem = (props: any) => {
  const {t} = useTranslation();
  const settings = getSettings();
  const theme = settings.theme ?? 'dark';

  const consoleItem = props.consoleItem;

  let apName = consoleItem.apName as string;
  let isPS5 = false;
  let isPS5Pro = false;

  if (apName) {
    apName = apName.toLocaleUpperCase();
    if (apName.indexOf('PS5') > -1) {
      isPS5 = true;

      if (apName.indexOf('PRO') > -1) {
        isPS5Pro = true;
      }
    }
  }

  let icon = isPS5 ? (isPS5Pro ? icons.PS5Pro : icons.PS5) : icons.ConsoleIcon;
  let imageStyle = isPS5 ? styles.image : {};
  let iconHeight = 80;
  if (isPS5) {
    iconHeight = 100;
  }

  if (theme !== 'dark') {
    icon = isPS5
      ? isPS5Pro
        ? icons.PS5ProLight
        : icons.PS5Light
      : icons.ConsoleIcon;
  }

  return (
    <Card style={styles.wrap}>
      <Card.Content>
        <View style={styles.consoleInfos}>
          <Text variant="titleLarge" style={styles.textCenter}>
            {consoleItem.serverNickname}
          </Text>
          <View style={imageStyle}>
            <SvgXml xml={icon} width={'100%'} height={iconHeight} />
          </View>
          {consoleItem.consoleId && (
            <Text variant="labelSmall" style={styles.textCenter}>
              ID.{consoleItem.consoleId}
            </Text>
          )}
          <Text variant="labelSmall" style={styles.textCenter}>
            IP: {consoleItem.host}
          </Text>
          <Text variant="labelSmall" style={styles.textCenter}>
            {t('RegistryTime')}:{' '}
            {dayjs(consoleItem.registedTime).format('YYYY.MM.DD HH:mm')}
          </Text>
        </View>
        {props.isEdit ? (
          <View style={styles.footer}>
            <Button
              mode="outlined"
              background={{
                borderless: false,
                color: 'rgba(255, 255, 255, 0.2)',
                foreground: true,
              }}
              onPress={props.onPressEdit}>
              {t('Edit')}
            </Button>
          </View>
        ) : (
          <View style={styles.footer}>
            <Button
              mode="outlined"
              background={{
                borderless: false,
                color: 'rgba(255, 255, 255, 0.2)',
                foreground: true,
              }}
              labelStyle={{marginHorizontal: 0}}
              style={styles.button}
              onPress={props.onPress}>
              {t('LocalStream')}
            </Button>

            <Button
              mode="outlined"
              background={{
                borderless: false,
                color: 'rgba(255, 255, 255, 0.2)',
                foreground: true,
              }}
              labelStyle={{marginHorizontal: 0}}
              onPress={props.onPressRemote}>
              {t('RemoteStream')}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  wrap: {},
  consoleInfos: {},
  image: {
    transform: [{rotate: '180deg'}],
    marginLeft: -20,
  },
  textCenter: {
    textAlign: 'center',
  },
  footer: {
    paddingTop: 10,
  },
  button: {
    marginBottom: 10,
  },
});

export default ConsoleItem;
