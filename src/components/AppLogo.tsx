import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

const logoSource = require('../../assets/logo.jpg');

// The app logo ("הכסף של בוקי"). Every place that shows the logo (the splash screen and the
// About screen) goes through this one component — swap `assets/logo.jpg` to change it everywhere.
export function AppLogo({ size = 88 }: Props) {
  return (
    <Image
      source={logoSource}
      resizeMode="cover"
      style={[styles.image, { width: size, height: size, borderRadius: size * 0.22 }]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
  },
});
