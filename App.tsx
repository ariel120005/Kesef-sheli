import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { TopBar } from './src/components/TopBar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { DemoBudgetDataProvider } from './src/hooks/useDemoBudgetData';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SavingsGoalScreen } from './src/screens/SavingsGoalScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TripsScreen } from './src/screens/TripsScreen';
import { ThemeColors, ThemeProvider, useTheme } from './src/theme';
import { OverlayScreen, TabKey } from './src/types';

function AppContent() {
  const { colors } = useTheme();
  const { initializing } = useAuth();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen | null>(null);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <StatusBar barStyle={colors.statusBarStyle} />
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const closeOverlay = () => setOverlayScreen(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={colors.statusBarStyle} />

        {overlayScreen === null && <TopBar onNavigate={setOverlayScreen} />}

        {overlayScreen === null && activeTab === 'home' && <HomeScreen />}
        {overlayScreen === null && activeTab === 'insights' && (
          <InsightsScreen
            onOpenTrips={() => setOverlayScreen('trips')}
            onOpenSavingsGoal={() => setOverlayScreen('savingsGoal')}
          />
        )}
        {overlayScreen === 'settings' && <SettingsScreen onBack={closeOverlay} />}
        {overlayScreen === 'account' && <ProfileScreen onBack={closeOverlay} />}
        {overlayScreen === 'trips' && <TripsScreen onBack={closeOverlay} />}
        {overlayScreen === 'savingsGoal' && <SavingsGoalScreen onBack={closeOverlay} />}
      </SafeAreaView>

      <SafeAreaView style={styles.tabBarSafeArea} edges={['bottom', 'left', 'right']}>
        <BottomTabBar
          active={activeTab}
          onChange={(tab) => {
            closeOverlay();
            setActiveTab(tab);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoBudgetDataProvider>
          <AppContent />
        </DemoBudgetDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBarSafeArea: {
      backgroundColor: colors.card,
    },
  });
}
