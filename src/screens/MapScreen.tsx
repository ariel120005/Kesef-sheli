import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemeColors, useTheme } from '../theme';

// A world map embed, not tied to any of the app's own data (no location tracking
// anywhere in the app) — just a general-purpose map view. WebView needs real
// native code, so this file is native-only; src/screens/MapScreen.web.tsx covers
// the web/GitHub-Pages preview build with a plain <iframe> instead.
const MAP_URL = 'https://www.openstreetmap.org/export/embed.html?bbox=-180,-85,180,85&layer=mapnik';

export function MapScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>מפה</Text>
      </View>
      <WebView source={{ uri: MAP_URL }} style={styles.webview} />
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
