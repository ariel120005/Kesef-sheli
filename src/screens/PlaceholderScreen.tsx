import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

export function PlaceholderScreen({ icon, title }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={COLORS.subtext} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>בקרוב</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.subtext,
  },
});
