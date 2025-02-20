import React from 'react';
import {StyleSheet, View, ScrollView, Alert, ToastAndroid} from 'react-native';
import {
  Button,
  RadioButton,
  Text,
  Divider,
  IconButton,
  Portal,
  Modal,
  Card,
} from 'react-native-paper';
import RNRestart from 'react-native-restart';
import {useTranslation} from 'react-i18next';
import {TokenStore} from '../store/tokenStore';
import type {UserInfo, PsnUsrtInfo} from '../types';

function UsersScreen({navigation}) {
  const {t} = useTranslation();

  const [users, setUsers] = React.useState<Array<UserInfo | PsnUsrtInfo>>([]);
  const [current, setCurrent] = React.useState('');
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [loginType, setLoginType] = React.useState('psn');

  React.useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <IconButton
          icon="plus"
          size={28}
          onPress={() => {
            setShowLoginModal(true);
          }}
        />
      ),
    });

    const ts = new TokenStore();
    ts.load();
    const tokens = ts.getToken();
    let hasDefault = false;
    tokens.forEach(item => {
      if (item.is_default) {
        hasDefault = true;
        setCurrent(item.user_id);
      }
    });
    if (!hasDefault && tokens[0]) {
      tokens[0].is_default = true;
      setCurrent(tokens[0].user_id);
    }
    setUsers(tokens);
  }, [navigation]);

  const handleSelect = () => {
    users.forEach(user => {
      if (user.user_id === current) {
        user.is_default = true;
      } else {
        user.is_default = false;
      }
    });
    const ts = new TokenStore();
    ts.load();
    ts.setToken(users);
    ts.save();
    setTimeout(() => {
      navigation.goBack();
    }, 30);
  };

  const handleDelect = () => {
    let username = '';
    users.forEach(user => {
      if (user.user_id === current) {
        username = user.online_id;
      }
    });
    Alert.alert(t('Warning'), `${t('Delete_user_text')}:${username}`, [
      {
        text: t('Cancel'),
        style: 'cancel',
      },
      {
        text: t('Confirm'),
        style: 'default',
        onPress: () => {
          const newUsers: Array<UserInfo | PsnUsrtInfo> = [];
          users.forEach(user => {
            if (user.user_id !== current) {
              newUsers.push(user);
            }
          });

          let hasDefault = false;
          newUsers.forEach(user => {
            if (user.is_default) {
              hasDefault = true;
            }
          });
          if (!hasDefault && newUsers[0]) {
            newUsers[0].is_default = true;
            setCurrent(newUsers[0].user_id);
          }
          setUsers(newUsers);

          const ts = new TokenStore();
          ts.load();
          ts.setToken(newUsers);
          ts.save();

          ToastAndroid.show(t('Deleted'), ToastAndroid.SHORT);

          if (newUsers.length === 0) {
            setTimeout(() => {
              RNRestart.restart();
            }, 1000);
          }
        },
      },
    ]);
  };

  const handleToLoginPage = () => {
    if (loginType === 'psn') {
      navigation.navigate('Login');
    } else {
      navigation.navigate({
        name: 'LoginUsername',
        params: {
          from: 'add',
        },
      });
    }
    setShowLoginModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Portal>
          <Modal
            visible={showLoginModal}
            onDismiss={() => setShowLoginModal(false)}>
            <Card>
              <Card.Content>
                <View>
                  <RadioButton.Group
                    onValueChange={val => setLoginType(val)}
                    value={loginType}>
                    <RadioButton.Item
                      key={1}
                      label={t('PSN login')}
                      value={'psn'}
                    />
                    <RadioButton.Item
                      key={2}
                      label={t('PSN username login')}
                      value={'psn_username'}
                    />
                  </RadioButton.Group>
                </View>

                <Button
                  mode="contained"
                  style={{marginTop: 20}}
                  onPress={handleToLoginPage}>
                  {t('Confirm')}
                </Button>
              </Card.Content>
            </Card>
          </Modal>
        </Portal>
        <View style={styles.tips}>
          <Text>{t('User_manager_desc1')}</Text>
          <Text>{t('User_manager_desc2')}</Text>
        </View>

        <Divider />

        <RadioButton.Group
          onValueChange={val => setCurrent(val)}
          value={current}>
          {users.map(user => {
            return (
              <RadioButton.Item
                key={user.user_id}
                label={`${user.online_id}(${user.user_id})`}
                value={user.user_id}
              />
            );
          })}
        </RadioButton.Group>
      </ScrollView>

      <View style={styles.buttonWrap}>
        {users.length > 0 ? (
          <Button mode="contained" style={styles.button} onPress={handleSelect}>
            {t('Select')}
          </Button>
        ) : null}

        {users.length > 0 ? (
          <Button mode="outlined" style={styles.button} onPress={handleDelect}>
            {t('Delete')}
          </Button>
        ) : null}

        <Button
          mode="outlined"
          style={styles.button}
          onPress={() => navigation.goBack()}>
          {t('Back')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tips: {
    padding: 10,
  },
  scrollView: {
    marginBottom: 120,
  },
  buttonWrap: {
    position: 'absolute',
    left: 0,
    width: '100%',
    bottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  button: {
    marginTop: 10,
  },
});

export default UsersScreen;
