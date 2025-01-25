import React from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import LinkText from '../components/LinkText';

function AboutScreen({navigation, route}) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.block}>
        <View style={styles.title}>
          <Text variant="titleLarge">PeaSyo</Text>
        </View>
        <View>
          <Text variant="titleMedium">
            PeaSyo is an open-source Android client for PlayStation 4/5 console
            streaming, great inspired by
            <LinkText url={'https://github.com/streetpea/chiaki-ng'}>
              chiaki-ng
            </LinkText>
          </Text>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.title}>
          <Text variant="titleLarge">Want to contribute to PeaSyo?</Text>
        </View>

        <View>
          <Text variant="titleMedium">PeaSyo:</Text>
        </View>
        <View>
          <LinkText url={'https://github.com/Geocld/PeaSyo'}>
            https://github.com/Geocld/PeaSyo
          </LinkText>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.title}>
          <Text variant="titleLarge">
            Are you looking for an Xbox streaming client?
          </Text>
        </View>

        <View>
          <Text variant="titleMedium">XStreaming:</Text>
        </View>
        <View>
          <LinkText url={'https://github.com/Geocld/XStreaming'}>
            https://github.com/Geocld/XStreaming
          </LinkText>
        </View>

        <View style={{marginTop: 10}}>
          <Text variant="titleMedium">
            XStreaming-desktop(Windows/MacOS/SteamOS):
          </Text>
        </View>
        <View>
          <LinkText url={'https://github.com/Geocld/XStreaming'}>
            https://github.com/Geocld/XStreaming-desktop
          </LinkText>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.title}>
          <Text variant="titleLarge">About author</Text>
        </View>
        <View>
          <View>
            <Text variant="titleMedium">Geocld:</Text>
          </View>
          <View>
            <LinkText url={'https://github.com/Geocld'}>
              https://github.com/Geocld
            </LinkText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  block: {
    marginBottom: 20,
  },
  title: {
    marginBottom: 10,
  },
});

export default AboutScreen;
