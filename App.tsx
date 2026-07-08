import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { TopBar } from './src/components/TopBar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { DemoBudgetDataProvider } from './src/hooks/useDemoBudgetData';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { MapScreen } from './src/screens/MapScreen';
import { NotificationSourcesScreen } from './src/screens/NotificationSourcesScreen';
import { ParseTestScreen } from './src/screens/ParseTestScreen';
import { ProfileMenuScreen } from './src/screens/ProfileMenuScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SavingsGoalScreen } from './src/screens/SavingsGoalScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TripsScreen } from './src/screens/TripsScreen';
import { ThemeColors, ThemeProvider, useTheme } from './src/theme';
import { OverlayScreen, TabKey } from './src/types';

interface NavState {
  tab: TabKey;
  overlayStack: OverlayScreen[];
}

const isWeb = Platform.OS === 'web';

function AppContent() {
  const { colors } = useTheme();
  const { initializing } = useAuth();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  // A real stack (not just one "current" screen) so back navigates one level at a time no matter
  // how deep — e.g. profile menu → settings → categories → back → settings → back → profile menu.
  const [overlayStack, setOverlayStack] = useState<OverlayScreen[]>([]);
  const overlayScreen = overlayStack[overlayStack.length - 1] ?? null;

  // On web, mirror in-app navigation into the browser's history so the Android hardware back
  // button / iOS swipe-back gesture steps through app screens one at a time instead of
  // immediately leaving the page — it only falls through to actually leaving the page once
  // there's no in-app history entry left to pop (i.e. back from the home tab with no overlay).
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    window.history.replaceState({ tab: 'home', overlayStack: [] } as NavState, '');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavState | null;
      if (!state) return; // no in-app history left; let the browser navigate away as usual
      setActiveTab(state.tab);
      setOverlayStack(state.overlayStack);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const pushOverlay = (screen: OverlayScreen) => {
    const nextStack = [...overlayStack, screen];
    setOverlayStack(nextStack);
    if (isWeb && typeof window !== 'undefined') {
      window.history.pushState({ tab: activeTab, overlayStack: nextStack } as NavState, '');
    }
  };

  const popOverlay = () => {
    // On web, go through the browser history instead of popping the stack directly, so the
    // in-app back button and the device back button/gesture stay in sync with each other.
    if (isWeb && typeof window !== 'undefined') {
      window.history.back();
    } else {
      setOverlayStack((stack) => stack.slice(0, -1));
    }
  };

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    setOverlayStack([]);
    if (isWeb && typeof window !== 'undefined') {
      window.history.pushState({ tab, overlayStack: [] } as NavState, '');
    }
  };

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
          <SettingsScreen
            onBack={popOverlay}
            onOpenCategories={() => pushOverlay('categories')}
            onOpenParseTest={() => pushOverlay('parseTest')}
            onOpenNotificationSources={() => pushOverlay('notificationSources')}
          />
        )}
        {overlayScreen === 'account' && <ProfileScreen onBack={popOverlay} />}
        {overlayScreen === 'trips' && <TripsScreen onBack={popOverlay} />}
        {overlayScreen === 'savingsGoal' && <SavingsGoalScreen onBack={popOverlay} />}
        {overlayScreen === 'categories' && <CategoriesScreen onBack={popOverlay} />}
        {overlayScreen === 'parseTest' && <ParseTestScreen onBack={popOverlay} />}
        {overlayScreen === 'notificationSources' && <NotificationSourcesScreen onBack={popOverlay} />}
      </SafeAreaView>

      <SafeAreaView style={styles.tabBarSafeArea} edges={['bottom', 'left', 'right']}>
        <BottomTabBar active={activeTab} onChange={changeTab} />
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
