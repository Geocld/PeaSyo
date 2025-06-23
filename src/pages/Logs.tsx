import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  NativeModules,
  Pressable,
} from 'react-native';
import {HelperText, List, Icon} from 'react-native-paper';
import {useTranslation} from 'react-i18next';

const {LogsModule} = NativeModules;

function LogsScreen({navigation}) {
  const {t} = useTranslation();
  const [logs, setLogs] = React.useState([]);

  React.useEffect(() => {
    LogsModule.getLogFiles().then(res => {
      setLogs(res);
    });
    return () => {};
  }, [navigation, t]);

  return (
    <ScrollView style={styles.container}>
      <View>
        <HelperText style={styles.title} type="info">
          {t('LogsTips')}
        </HelperText>
      </View>
      <View>
        {logs.map((log: any) => {
          return (
            <View key={log.filename} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <List.Item title={log.filename} />
              </View>

              <View style={styles.listItemRight}>
                <Pressable
                  onPress={() => {
                    LogsModule.shareLogFile(log.filename);
                  }}>
                  <Icon source="share-variant" size={30} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // paddingLeft: 10,
    paddingRight: 10,
  },
  title: {
    padding: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
  },
  listItemRight: {
    width: 30,
  },
});

export default LogsScreen;
