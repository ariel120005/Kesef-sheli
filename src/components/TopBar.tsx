import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { ThemeColors, useTheme } from '../theme';
import { OverlayScreen } from '../types';

interface Props {
  onNavigate: (screen: OverlayScreen) => void;
}

export function TopBar({ onNavigate }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Trips/savings-goal are per-account features — in real (non-demo) mode they only make sense
  // in the menu once actually signed in; in demo mode there's no sign-in concept at all, so they
  // stay available like every other demo feature.
  const showAccountFeatures = !isFirebaseConfigured || !!user;

  const navigate = (screen: OverlayScreen) => {
    setMenuOpen(false);
    onNavigate(screen);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable onPress={() => setMenuOpen((open) => !open)} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="person-circle-outline" size={28} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => {}} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="search-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menu, SHADOW]} onPress={() => {}}>
            <MenuItem label="הגדרות" onPress={() => navigate('settings')} />
            <MenuItem label={user ? 'החשבון שלי' : 'התחברות'} onPress={() => navigate('account')} />
            {showAccountFeatures && (
              <>
                <MenuItem label="טיולים" onPress={() => navigate('trips')} />
                <MenuItem label="יעד חיסכון" onPress={() => navigate('savingsGoal')} last />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable onPress={onPress} style={[styles.menuItem, !last && styles.menuItemBorder]}>
      <Text style={styles.menuItemText}>{label}</Text>
    </Pressable>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      zIndex: 10,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 22,
      paddingTop: 10,
      paddingBottom: 6,
    },
    iconButton: {
      padding: 6,
    },
    backdrop: {
      flex: 1,
      alignItems: 'flex-end',
      paddingTop: 54,
      paddingHorizontal: 22,
    },
    menu: {
      minWidth: 190,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      paddingVertical: 4,
    },
    menuItem: {
      paddingVertical: 13,
      paddingHorizontal: 18,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
    },
  });
}
