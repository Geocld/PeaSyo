import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

type Props = {
  text: string;
};

const Spinner: React.FC<Props> = ({text}) => {
  return (
    <View style={styles.container}>
      <View style={styles.spinnerBox}>
        <ActivityIndicator animating={true} color={'#DF6069'} size="large" />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 998,
  },
  spinnerBox: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: 10,
  },
  text: {
    color: '#DF6069',
    fontSize: 16,
  },
});

export default Spinner;
