import React, { useEffect, useRef, useState } from 'react';
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

const isWeb = Platform.OS === 'web';

function AppContent() {
  const { colors } = useTheme();
  const { initializing } = useAuth();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  // A real stack (not just one "current" screen) so the in-app back arrows on each screen still
  // navigate one level at a time no matter how deep — e.g. profile menu → settings → categories
  // → back → settings → back → profile menu.
  const [overlayStack, setOverlayStack] = useState<OverlayScreen[]>([]);
  const overlayScreen = overlayStack[overlayStack.length - 1] ?? null;
  const isAway = activeTab !== 'home' || overlayStack.length > 0;
  const prevAwayRef = useRef(false);
  const skipNextSyncRef = useRef(false);

  // On web, the device back button (Android) / swipe-back gesture (iOS) should behave like
  // standard bottom-nav-bar apps: from anywhere other than the home tab, back always returns
  // straight to home — never to whatever screen was previously visited, no matter how many tabs
  // or overlay screens deep the user has navigated — and only from home does back actually leave
  // the site. That means the browser history only ever needs at most one extra entry beyond the
  // initial "home" entry: pushed the first time the user leaves home, then updated in place
  // (replaceState) for every further move between non-home screens, so a single "back" pop always
  // lands back on that one home entry.
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    window.history.replaceState({ away: false }, '');

    const handlePopState = () => {
      skipNextSyncRef.current = true;
      setActiveTab('home');
      setOverlayStack([]);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      prevAwayRef.current = isAway;
      return;
    }
    if (isAway && !prevAwayRef.current) {
      window.history.pushState({ away: true }, '');
    } else if (isAway && prevAwayRef.current) {
      window.history.replaceState({ away: true }, '');
    } else if (!isAway && prevAwayRef.current) {
      window.history.back();
    }
    prevAwayRef.current = isAway;
  }, [isAway]);

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

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    setOverlayStack([]);
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
