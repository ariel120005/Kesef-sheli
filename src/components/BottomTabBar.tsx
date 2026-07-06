import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme';
import { TabKey } from '../types';

interface Tab {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: Tab[] = [
  { key: 'profile', label: 'פרופיל', icon: 'person-outline', iconActive: 'person' },
  { key: 'home', label: 'בית', icon: 'home-outline', iconActive: 'home' },
  { key: 'trips', label: 'טיולים', icon: 'airplane-outline', iconActive: 'airplane' },
  { key: 'settings', label: 'הגדרות', icon: 'settings-outline', iconActive: 'settings' },
];

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomTabBar({ active, onChange }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Ionicons
              name={selected ? tab.iconActive : tab.icon}
              size={24}
              color={selected ? colors.turquoise : colors.subtext}
            />
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row-reverse',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: 10,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingBottom: 8,
    },
    label: {
      fontSize: 12,
      color: colors.subtext,
      fontWeight: '600',
    },
    labelActive: {
      color: colors.turquoise,
      fontWeight: '700',
    },
  });
}
