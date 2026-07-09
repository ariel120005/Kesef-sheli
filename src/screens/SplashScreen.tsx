import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { DARK_COLORS } from '../constants';

// Shown briefly on app launch (see App.tsx), always on the dark surface regardless of the
// user's chosen theme — matches how a launch screen looks before the theme provider even matters.
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <AppLogo size={96} />
      <Text style={styles.title}>כסף שלי</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    color: DARK_COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
