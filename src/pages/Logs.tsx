import React from 'react';
import {StyleSheet, View, Alert, ScrollView, NativeModules} from 'react-native';
import {Button, Text, List} from 'react-native-paper';
import {useTranslation} from 'react-i18next';

const {LogsModule} = NativeModules;

function LogsScreen({navigation}) {
  const {t} = useTranslation();
  const [logs, setLogs] = React.useState([]);

  React.useEffect(() => {
    LogsModule.getLogFiles().then(res => {
      console.log('getLogFiles:', res);
      setLogs(res);
    });
    return () => {};
  }, [navigation, t]);

  return (
    <ScrollView style={styles.container}>
      <View>
        {logs.map((log: any) => {
          return (
            <View key={log.filename}>
              <List.Item title={log.filename} />

              <View>
                <Button
                  icon="camera"
                  mode="contained"
                  onPress={() => {
                    LogsModule.shareLogFile(log.filename);
                  }}>
                  Share
                </Button>
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
    paddingLeft: 10,
    paddingRight: 10,
  },
  block: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    paddingBottom: 10,
  },
});

export default LogsScreen;
