import React from 'react';
import {StyleSheet, View} from 'react-native';
import {List} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {TokenStore} from '../store/tokenStore';

function OptionsScreen({navigation, route}) {
  const {t} = useTranslation();

  const handleTo = name => {
    navigation.navigate({
      name,
    });
  };

  const ts = new TokenStore();
  ts.load();
  const tokens = ts.getToken();

  return (
    <View style={styles.container}>
      <List.Section>
        {tokens.length > 0 && (
          <List.Item
            title={t('Manager')}
            description={''}
            left={() => <List.Icon icon="square-edit-outline" />}
            right={() => (
              <Ionicons
                name={'chevron-forward-outline'}
                size={20}
                color={'#fff'}
              />
            )}
            onPress={() => {
              handleTo('Consoles');
            }}
          />
        )}

        {tokens.length > 0 && (
          <List.Item
            title={t('Registry')}
            description={''}
            left={() => <List.Icon icon="link-plus" />}
            right={() => (
              <Ionicons
                name={'chevron-forward-outline'}
                size={20}
                color={'#fff'}
              />
            )}
            onPress={() => {
              handleTo('Registry');
            }}
          />
        )}

        <List.Item
          title={t('Settings')}
          description={''}
          left={() => <List.Icon icon="cog-outline" />}
          right={() => (
            <Ionicons
              name={'chevron-forward-outline'}
              size={20}
              color={'#fff'}
            />
          )}
          onPress={() => {
            handleTo('Settings');
          }}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  buttonsWrap: {
    marginTop: 30,
  },
  button: {
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 500,
  },
});

export default OptionsScreen;
