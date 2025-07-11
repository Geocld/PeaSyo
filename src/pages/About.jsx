import React from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import LinkText from '../components/LinkText';

function AboutScreen({navigation, route}) {
  const {i18n} = useTranslation();
  const currentLanguage = i18n.language;

  return (
    <ScrollView style={styles.container}>
      {currentLanguage === 'zh' || currentLanguage === 'zht' ? (
        <View>
          <View style={styles.block}>
            <View style={styles.title}>
              <Text variant="titleLarge">PeaSyo(貔貅)</Text>
            </View>
            <View>
              <Text variant="titleMedium">
                PeaSyo是一款安卓端开源免费的PS4/5串流应用，旨在给小众的串流玩家多一个选择。
              </Text>
            </View>
          </View>

          <View style={styles.block}>
            <View style={styles.title}>
              <Text variant="titleLarge">如何给PeaSyo做贡献?</Text>
            </View>

            <View>
              <Text variant="titleMedium">PeaSyo项目地址:</Text>
            </View>
            <View>
              <LinkText url={'https://github.com/Geocld/PeaSyo'}>
                https://github.com/Geocld/PeaSyo
              </LinkText>
            </View>
            <View>
              <Text variant="titleMedium">
                如果你喜欢这个项目，欢迎给项目点一个star。
              </Text>
            </View>
          </View>

          <View style={styles.block}>
            <View style={styles.title}>
              <Text variant="titleLarge">如果你在寻找Xbox串流应用↓</Text>
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
              <Text variant="titleLarge">关于作者</Text>
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
        </View>
      ) : (
        <View>
          <View style={styles.block}>
            <View style={styles.title}>
              <Text variant="titleLarge">PeaSyo</Text>
            </View>
            <View>
              <Text variant="titleMedium">
                PeaSyo is an open-source Android client for PlayStation 4/5
                console streaming.
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
        </View>
      )}
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
