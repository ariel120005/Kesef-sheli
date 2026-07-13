import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Trip, TripTransaction } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  trip: Trip;
  transactions: TripTransaction[];
  onPress: () => void;
  onDelete: () => void;
  canDelete?: boolean;
}

export function TripCard({ trip, transactions, onPress, onDelete, canDelete = true }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const gross = transactions
    .filter((t) => t.type === 'expense' || t.type === 'fee')
    .reduce((sum, t) => sum + t.amount, 0);
  const reimbursed = transactions
    .filter((t) => t.type === 'reimbursement')
    .reduce((sum, t) => sum + t.amount, 0);
  const net = gross - reimbursed;
  const ratio = trip.budget > 0 ? net / trip.budget : 0;
  const zone = ratio >= 1 ? 'over' : ratio >= 0.7 ? 'warning' : 'safe';

  return (
    <Pressable onPress={onPress} style={[styles.card, SHADOW]}>
      <View style={styles.headerRow}>
        {canDelete && (
          <Pressable onPress={onDelete} style={styles.deleteButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        )}
        <Text style={styles.name}>{trip.name}</Text>
        {trip.isShared && (
          <View style={styles.sharedBadge}>
            <Ionicons name="people" size={11} color={colors.accent} />
            <Text style={styles.sharedBadgeText}>{trip.participants?.length ?? 1}</Text>
          </View>
        )}
        {!!trip.endedAt && (
          <View style={styles.endedBadge}>
            <Text style={styles.endedBadgeText}>הסתיים</Text>
          </View>
        )}
      </View>

      <View style={styles.barTrack}>
        <LinearGradient
          colors={GRADIENTS[zone]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={[styles.barFill, { width: `${Math.min(ratio, 1) * 100}%` }]}
        />
      </View>

      <Text style={styles.subtitle}>
        {formatCurrency(net)} מתוך {formatCurrency(trip.budget)} (נטו)
      </Text>
    </Pressable>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    headerRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    name: {
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    deleteButton: {
      borderRadius: 8,
      padding: 4,
      backgroundColor: colors.deleteBackground,
    },
    sharedBadge: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sharedBadgeText: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: '700',
    },
    endedBadge: {
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    endedBadgeText: {
      color: colors.subtext,
      fontSize: 10,
      fontWeight: '700',
    },
    barTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.chipBackground,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 5,
    },
    subtitle: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
      marginTop: 10,
    },
  });
}
