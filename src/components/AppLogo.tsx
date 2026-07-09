import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GRADIENTS } from '../constants';

interface Props {
  size?: number;
}

// Temporary placeholder logo — a wallet icon in the app's turquoise→purple brand gradient —
// until a real logo/icon is designed. Swap this component's contents for an <Image> once one
// exists; every place that shows the logo (currently just the splash screen) goes through here.
export function AppLogo({ size = 88 }: Props) {
  return (
    <LinearGradient
      colors={GRADIENTS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Ionicons name="wallet" size={size * 0.5} color="#0A0A0F" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
