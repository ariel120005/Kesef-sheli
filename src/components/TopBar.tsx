import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  onOpenProfileMenu: () => void;
  // The search icon is only meaningful on the Map tab today (it has its own always-visible
  // search bar built in) — every other tab has no search feature yet, so hide it there.
  showSearch?: boolean;
  // The Map tab is fullscreen edge-to-edge, so its own top bar floats over the map (translucent,
  // white icons) instead of reserving its own row like on every other tab.
  floating?: boolean;
}

export function TopBar({ onOpenProfileMenu, showSearch = false, floating = false }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const iconColor = floating ? '#FFFFFF' : colors.text;

  return (
    <View style={[styles.wrapper, floating && styles.wrapperFloating]}>
      <View style={[styles.row, floating && styles.rowFloating]}>
        <Pressable onPress={onOpenProfileMenu} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="person-circle-outline" size={28} color={iconColor} />
        </Pressable>
        {showSearch && (
          <Pressable onPress={() => {}} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="search-outline" size={22} color={iconColor} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      zIndex: 10,
    },
    wrapperFloating: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 22,
      paddingTop: 10,
      paddingBottom: 6,
    },
    rowFloating: {
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    iconButton: {
      padding: 6,
    },
  });
}
