import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from './src/components/BottomTabBar';
import { DotBackground } from './src/components/DotBackground';
import { TopBar } from './src/components/TopBar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { DemoBudgetDataProvider } from './src/hooks/useDemoBudgetData';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { MapScreen } from './src/screens/MapScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { NotificationSourcesScreen } from './src/screens/NotificationSourcesScreen';
import { ParseTestScreen } from './src/screens/ParseTestScreen';
import { ProfileMenuScreen } from './src/screens/ProfileMenuScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SavingsGoalScreen } from './src/screens/SavingsGoalScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
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
  // A real stack (not just one "current" screen) so back navigates one level at a time no matter
  // how deep — e.g. profile menu → settings → categories → back → settings → back → profile menu.
  const [overlayStack, setOverlayStack] = useState<OverlayScreen[]>([]);
  const overlayScreen = overlayStack[overlayStack.length - 1] ?? null;

  // The app's navigation forms a fixed tree, not a linear visit history: a non-home tab is a
  // child of home, and each pushed overlay is a child of whatever was on screen when it was
  // opened. "Depth" is this tree position collapsed to a single number — 0 at home, +1 for being
  // on a non-home tab, +1 more per overlay stacked on top — so that moving between sibling tabs
  // (which doesn't change depth) is naturally a no-op here, and only genuine parent→child moves
  // change it. Mirrored 1:1 into browser history below so one back/forward step always moves
  // exactly one level of this tree — never further, and never to an unrelated previously-visited
  // screen — and back from home (depth 0) falls through to actually leaving the page.
  const depth = (activeTab === 'home' ? 0 : 1) + overlayStack.length;
  const depthRef = useRef(0);
  // Set by the popstate handler right before it updates state, so the depth-sync effect below
  // knows this particular depth change already matches where the browser just navigated to, and
  // skips re-driving history for it (which would otherwise double-navigate).
  const skipNextDepthSyncRef = useRef(false);
  // Set by the depth-sync effect right before it calls history.go() for an in-app-triggered pop,
  // so the popstate that call itself produces is recognized as an echo (state was already
  // updated directly) rather than a second, unrelated back-navigation to also act on.
  const ignoreNextPopstateRef = useRef(false);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    window.history.replaceState(null, '');

    const handlePopState = () => {
      if (ignoreNextPopstateRef.current) {
        ignoreNextPopstateRef.current = false;
        return;
      }
      skipNextDepthSyncRef.current = true;
      if (overlayStack.length > 0) {
        setOverlayStack((stack) => stack.slice(0, -1));
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, overlayStack]);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;
    if (skipNextDepthSyncRef.current) {
      skipNextDepthSyncRef.current = false;
      depthRef.current = depth;
      return;
    }
    const delta = depth - depthRef.current;
    if (delta > 0) {
      for (let i = 0; i < delta; i++) window.history.pushState(null, '');
    } else if (delta < 0) {
      ignoreNextPopstateRef.current = true;
      window.history.go(delta);
    }
    depthRef.current = depth;
  }, [depth]);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <DotBackground />
          <StatusBar barStyle={colors.statusBarStyle} />
          <ActivityIndicator size="large" color={colors.accent} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const pushOverlay = (screen: OverlayScreen) => setOverlayStack((stack) => [...stack, screen]);
  const popOverlay = () => setOverlayStack((stack) => stack.slice(0, -1));
  // Used only when navigating away from the profile menu: the menu itself is a transient
  // selector, not a real stop in the hierarchy, so choosing one of its rows swaps it out for the
  // destination screen instead of stacking on top of it — the destination's parent is whatever
  // was on screen before the profile menu opened (its own tab), matching "settings' parent is
  // home because I opened it via the profile menu" rather than "...via profile menu, via home".
  const replaceOverlay = (screen: OverlayScreen) =>
    setOverlayStack((stack) => [...stack.slice(0, -1), screen]);

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    setOverlayStack([]);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <DotBackground />
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
          <ProfileMenuScreen onBack={popOverlay} onNavigate={replaceOverlay} />
        )}
        {overlayScreen === 'settings' && (
          <SettingsScreen
            onBack={popOverlay}
            onOpenCategories={() => pushOverlay('categories')}
            onOpenParseTest={() => pushOverlay('parseTest')}
            onOpenNotificationSources={() => pushOverlay('notificationSources')}
            onOpenAbout={() => pushOverlay('about')}
          />
        )}
        {overlayScreen === 'account' && <ProfileScreen onBack={popOverlay} />}
        {overlayScreen === 'trips' && <TripsScreen onBack={popOverlay} />}
        {overlayScreen === 'savingsGoal' && <SavingsGoalScreen onBack={popOverlay} />}
        {overlayScreen === 'categories' && <CategoriesScreen onBack={popOverlay} />}
        {overlayScreen === 'parseTest' && <ParseTestScreen onBack={popOverlay} />}
        {overlayScreen === 'notificationSources' && <NotificationSourcesScreen onBack={popOverlay} />}
        {overlayScreen === 'about' && <AboutScreen onBack={popOverlay} />}
      </SafeAreaView>

      <SafeAreaView style={styles.tabBarSafeArea} edges={['bottom', 'left', 'right']}>
        <BottomTabBar active={activeTab} onChange={changeTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const SPLASH_DURATION_MS = 1300;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

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
