import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NativeWorkoutCamera() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Camera-based workout is only available on mobile devices.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
