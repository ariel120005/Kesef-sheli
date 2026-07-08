import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { TopBar } from './src/components/TopBar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { DemoBudgetDataProvider } from './src/hooks/useDemoBudgetData';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProfileMenuScreen } from './src/screens/ProfileMenuScreen';
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
  // A real stack (not just one "current" screen) so back navigates one level at a time no matter
  // how deep — e.g. profile menu → settings → categories → back → settings → back → profile menu.
  const [overlayStack, setOverlayStack] = useState<OverlayScreen[]>([]);
  const overlayScreen = overlayStack[overlayStack.length - 1] ?? null;

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

  const pushOverlay = (screen: OverlayScreen) => setOverlayStack((stack) => [...stack, screen]);
  const popOverlay = () => setOverlayStack((stack) => stack.slice(0, -1));
  const closeAllOverlays = () => setOverlayStack([]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={colors.statusBarStyle} />

        {overlayScreen === null && (
          <TopBar
            onOpenProfileMenu={() => pushOverlay('profileMenu')}
            showSearch={activeTab === 'map'}
            floating={activeTab === 'map'}
          />
        )}

        {overlayScreen === null && activeTab === 'home' && <HomeScreen />}
        {overlayScreen === null && activeTab === 'insights' && (
          <InsightsScreen
            onOpenTrips={() => pushOverlay('trips')}
            onOpenSavingsGoal={() => pushOverlay('savingsGoal')}
          />
        )}
        {overlayScreen === null && activeTab === 'map' && <MapScreen />}
        {overlayScreen === 'profileMenu' && (
          <ProfileMenuScreen onBack={popOverlay} onNavigate={pushOverlay} />
        )}
        {overlayScreen === 'settings' && (
          <SettingsScreen onBack={popOverlay} onOpenCategories={() => pushOverlay('categories')} />
        )}
        {overlayScreen === 'account' && <ProfileScreen onBack={popOverlay} />}
        {overlayScreen === 'trips' && <TripsScreen onBack={popOverlay} />}
        {overlayScreen === 'savingsGoal' && <SavingsGoalScreen onBack={popOverlay} />}
        {overlayScreen === 'categories' && <CategoriesScreen onBack={popOverlay} />}
      </SafeAreaView>

      <SafeAreaView style={styles.tabBarSafeArea} edges={['bottom', 'left', 'right']}>
        <BottomTabBar
          active={activeTab}
          onChange={(tab) => {
            closeAllOverlays();
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
