import React, {useState} from 'react';
import {StyleSheet, View, FlatList, Dimensions} from 'react-native';
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
  const [numColumns, setNumColumns] = React.useState(2);

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

    const updateLayout = () => {
      const {width, height} = Dimensions.get('window');
      setNumColumns(width > height ? 4 : 2);
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);

    return () => {
      subscription?.remove();
    };
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

  const handleEdit = item => {
    let idx = 0;
    consoles.forEach((_console, i) => {
      if (_console.id === item.id) {
        idx = i;
      }
    });
    navigation.navigate({
      name: 'ConsoleEdit',
      params: {
        idx,
      },
    });
  };

  return (
    <View style={styles.container}>
      {consoles.length ? (
        <>
          <FlatList
            data={consoles}
            numColumns={numColumns}
            key={numColumns}
            contentContainerStyle={styles.listContainer}
            renderItem={({item}) => {
              return (
                <View
                  style={[
                    styles.consoleItem,
                    numColumns === 4 ? styles.listItemH : styles.listItemV,
                  ]}>
                  <ConsoleItem
                    consoleItem={item}
                    isEdit
                    onPressEdit={() => handleEdit(item)}
                  />
                </View>
              );
            }}
          />
        </>
      ) : (
        <View style={styles.centerContainer}>{renderRegistry()}</View>
      )}
    </View>
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
  listContainer: {},
  consoleItem: {
    padding: 10,
  },
  listItemH: {
    width: '25%',
    justifyContent: 'center',
  },
  listItemV: {
    width: '50%',
    justifyContent: 'center',
  },
});

export default ConsolesScreen;
