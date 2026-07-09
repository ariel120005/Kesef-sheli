import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { ThemeColors, useTheme } from '../theme';
import { OverlayScreen } from '../types';

interface Props {
  onBack: () => void;
  onNavigate: (screen: OverlayScreen) => void;
}

export function ProfileMenuScreen({ onBack, onNavigate }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();

  // Trips/savings-goal are per-account features — in real (non-demo) mode they only make sense
  // once actually signed in; in demo mode there's no sign-in concept at all, so they stay
  // available like every other demo feature.
  const showAccountFeatures = !isFirebaseConfigured || !!user;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.header}>פרופיל</Text>
      </View>

      <MenuRow icon="options-outline" label="הגדרות" onPress={() => onNavigate('settings')} />
      <MenuRow
        icon="person-circle-outline"
        label={user ? 'החשבון שלי' : 'התחברות'}
        onPress={() => onNavigate('account')}
      />
      {showAccountFeatures && (
        <>
          <MenuRow icon="airplane-outline" label="טיולים" onPress={() => onNavigate('trips')} />
          <MenuRow icon="wallet-outline" label="יעד חיסכון" onPress={() => onNavigate('savingsGoal')} />
        </>
      )}
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={[styles.row, SHADOW]} onPress={onPress}>
      <Ionicons name="chevron-back" size={18} color={colors.subtext} />
      <Text style={styles.rowText}>{label}</Text>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
    </Pressable>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 22,
    },
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 24,
    },
    backButton: {
      borderRadius: 10,
      padding: 4,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    rowText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    rowIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.chipBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
