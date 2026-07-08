import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { TopBar } from './src/components/TopBar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { DemoBudgetDataProvider } from './src/hooks/useDemoBudgetData';
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
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen | null>(null);
  // Which screen "back" should return to for the screens reachable from the profile menu
  // (settings/account/trips/savingsGoal) — the profile menu itself if that's how we got here,
  // or null (the active tab) when opened directly, e.g. via the Insights shortcut cards.
  const [overlayBack, setOverlayBack] = useState<OverlayScreen | null>(null);

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

  const closeOverlay = () => {
    setOverlayScreen(null);
    setOverlayBack(null);
  };
  // Opened directly (Insights shortcut cards, TopBar profile icon): back returns to the tab.
  const openOverlay = (screen: OverlayScreen) => {
    setOverlayBack(null);
    setOverlayScreen(screen);
  };
  // Opened from within the profile menu: back returns to the profile menu, not the tab.
  const openFromProfileMenu = (screen: OverlayScreen) => {
    setOverlayBack('profileMenu');
    setOverlayScreen(screen);
  };
  const backFromOverlay = () => setOverlayScreen(overlayBack);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={colors.statusBarStyle} />

        {overlayScreen === null && (
          <TopBar
            onOpenProfileMenu={() => openOverlay('profileMenu')}
            showSearch={activeTab === 'map'}
            floating={activeTab === 'map'}
          />
        )}

        {overlayScreen === null && activeTab === 'home' && <HomeScreen />}
        {overlayScreen === null && activeTab === 'insights' && (
          <InsightsScreen
            onOpenTrips={() => openOverlay('trips')}
            onOpenSavingsGoal={() => openOverlay('savingsGoal')}
          />
        )}
        {overlayScreen === null && activeTab === 'map' && <MapScreen />}
        {overlayScreen === 'profileMenu' && (
          <ProfileMenuScreen onBack={closeOverlay} onNavigate={openFromProfileMenu} />
        )}
        {overlayScreen === 'settings' && <SettingsScreen onBack={backFromOverlay} />}
        {overlayScreen === 'account' && <ProfileScreen onBack={backFromOverlay} />}
        {overlayScreen === 'trips' && <TripsScreen onBack={backFromOverlay} />}
        {overlayScreen === 'savingsGoal' && <SavingsGoalScreen onBack={backFromOverlay} />}
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
