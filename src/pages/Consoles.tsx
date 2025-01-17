import React, {useState} from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import ConsoleItem from '../components/ConsoleItem';
import {getConsoles} from '../store/consolesStore';
import {debugFactory} from '../utils/debug';

const log = debugFactory('ConsolesScreens');

type Console = {
  host: string;
  id: string;
  name: string;
  type: string;
};

function ConsolesScreen({navigation}) {
  const {t} = useTranslation();
  const [consoles, setConsoles] = useState<Console[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      log.info('Refreshing ConsolesScreens');
      const _consoles = getConsoles();
      setConsoles(_consoles);
    }, []),
  );

  React.useEffect(() => {
    const _consoles = getConsoles();
    log.info('consoles:', _consoles);
    setConsoles(_consoles);
  }, [navigation, t]);

  const renderRegistry = () => {
    return (
      <View>
        <Text style={styles.title}>{t('NoRegistry')}</Text>
        <Button
          mode="contained"
          onPress={() => {
            navigation.navigate('Registry');
          }}>
          {t('Registry')}
        </Button>
      </View>
    );
  };

  const handleEdit = idx => {
    navigation.navigate({
      name: 'ConsoleEdit',
      params: {
        idx,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {consoles.length ? (
        <View>
          {consoles.map((item, idx) => {
            return (
              <ConsoleItem
                key={idx}
                consoleItem={item}
                isEdit
                onPressEdit={() => handleEdit(idx)}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.centerContainer}>{renderRegistry()}</View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
});

export default ConsolesScreen;
