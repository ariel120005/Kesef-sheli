import React, { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { COLORS } from './src/constants';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlaceholderScreen } from './src/screens/PlaceholderScreen';
import { TabKey } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" />

        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'profile' && <PlaceholderScreen icon="person-outline" title="פרופיל" />}
        {activeTab === 'settings' && <PlaceholderScreen icon="settings-outline" title="הגדרות" />}
      </SafeAreaView>

      <SafeAreaView style={styles.tabBarSafeArea} edges={['bottom', 'left', 'right']}>
        <BottomTabBar active={activeTab} onChange={setActiveTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBarSafeArea: {
    backgroundColor: COLORS.card,
  },
});
