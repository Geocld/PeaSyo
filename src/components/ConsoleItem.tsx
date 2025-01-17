import React from 'react';
import {StyleSheet, View, useColorScheme} from 'react-native';
import {Card, Text, Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {SvgXml} from 'react-native-svg';
import dayjs from 'dayjs';
import icons from '../common/svg';

const ConsoleItem = (props: any) => {
  const {t} = useTranslation();

  const consoleItem = props.consoleItem;

  return (
    <Card style={styles.wrap}>
      <Card.Content>
        <View style={styles.consoleInfos}>
          <View style={styles.infoLeft}>
            <SvgXml
              // xml={theme === 'dark' ? icons.ConsoleDark : icons.ConsoleLight}
              xml={icons.ConsoleIcon}
              width={60}
              height={60}
            />
          </View>
          <View style={styles.infoRight}>
            <Text variant="titleLarge">{consoleItem.serverNickname}</Text>
            {consoleItem.consoleId && (
              <Text variant="labelSmall">ID.{consoleItem.consoleId}</Text>
            )}
            <Text variant="labelSmall">IP: {consoleItem.host}</Text>
            <Text variant="labelSmall">
              {t('RegistryTime')}:{' '}
              {dayjs(consoleItem.registedTime).format('YYYY.MM.DD HH:mm')}
            </Text>
          </View>
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
  wrap: {
    marginTop: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  consoleInfos: {
    display: 'flex',
    flexDirection: 'row',
  },
  infoLeft: {
    width: 70,
  },
  infoRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  footer: {
    paddingTop: 10,
  },
  button: {
    marginBottom: 10,
  },
});

export default ConsoleItem;
