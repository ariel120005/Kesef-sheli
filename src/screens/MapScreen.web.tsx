import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme';

// Web build of the map tab: a plain <iframe> instead of react-native-webview,
// since that package has no web implementation. Same OpenStreetMap embed as
// the native version (src/screens/MapScreen.tsx).
const MAP_URL = 'https://www.openstreetmap.org/export/embed.html?bbox=-180,-85,180,85&layer=mapnik';

export function MapScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>מפה</Text>
      </View>
      <View style={styles.webview}>
        {React.createElement('iframe', {
          src: MAP_URL,
          title: 'מפה',
          style: { border: 0, width: '100%', height: '100%' },
        } as Record<string, unknown>)}
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRow: {
      padding: 22,
      paddingBottom: 12,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    webview: {
      flex: 1,
    },
  });
}
