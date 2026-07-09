import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Trip, TripTransaction } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  trip: Trip;
  transactions: TripTransaction[];
}

export function TripStatsCard({ trip, transactions }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const gross = transactions
    .filter((t) => t.type === 'expense' || t.type === 'fee')
    .reduce((sum, t) => sum + t.amount, 0);
  const reimbursed = transactions
    .filter((t) => t.type === 'reimbursement')
    .reduce((sum, t) => sum + t.amount, 0);
  const net = gross - reimbursed;
  const remaining = trip.budget - net;
  const ratio = trip.budget > 0 ? net / trip.budget : 0;
  const zone = ratio >= 1 ? 'over' : ratio >= 0.7 ? 'warning' : 'safe';
  const zoneColor = colors[zone];

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>{trip.name}</Text>

      <View style={styles.barTrack}>
        <LinearGradient
          colors={GRADIENTS[zone]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={[styles.barFill, { width: `${Math.min(ratio, 1) * 100}%` }]}
        />
      </View>

      <Text style={[styles.remainingText, { color: zoneColor }]}>
        {remaining >= 0
          ? `נותרו ${formatCurrency(remaining)} מהתקציב`
          : `חריגה של ${formatCurrency(Math.abs(remaining))}`}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatCurrency(gross)}</Text>
          <Text style={styles.statLabel}>הוצאתי (ברוטו)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.safe }]}>{formatCurrency(reimbursed)}</Text>
          <Text style={styles.statLabel}>קיבלתי בהחזרים</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{formatCurrency(net)}</Text>
          <Text style={styles.statLabel}>הוצאה נטו</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatCurrency(trip.budget)}</Text>
          <Text style={styles.statLabel}>תקציב הטיול</Text>
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 22,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 18,
    },
    barTrack: {
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.chipBackground,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 8,
    },
    remainingText: {
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'right',
      marginTop: 10,
      marginBottom: 18,
    },
    statsGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 12,
    },
    statBox: {
      width: '47%',
      backgroundColor: colors.chipBackground,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
