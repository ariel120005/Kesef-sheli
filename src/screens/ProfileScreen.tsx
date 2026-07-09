import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { ThemeColors, useTheme } from '../theme';
import { AuthScreen } from './AuthScreen';

interface Props {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.header}>{user ? 'החשבון שלי' : 'התחברות'}</Text>
      </View>

      {!user ? (
        <AuthScreen embedded />
      ) : (
        <View style={[styles.card, SHADOW]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.accent} />
          </View>
          <Text style={styles.connectedLabel}>מחוברים כ-</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      )}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      padding: 22,
      paddingBottom: 0,
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
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      marginHorizontal: 22,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.chipBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    connectedLabel: {
      color: colors.subtext,
      fontSize: 13,
    },
    email: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      marginTop: 4,
    },
  });
}
