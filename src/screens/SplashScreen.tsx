import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { DotBackground } from '../components/DotBackground';
import { DARK_COLORS } from '../constants';

// Shown briefly on app launch (see App.tsx), always on the dark surface regardless of the
// user's chosen theme — matches how a launch screen looks before the theme provider even matters.
// No separate app-name caption: the logo image itself is a full lockup (icon + name + tagline).
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <DotBackground />
      <AppLogo size={160} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
