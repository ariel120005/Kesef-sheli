import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Trip, TripTransaction } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  trip: Trip;
  transactions: TripTransaction[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Shown once a trip has been marked finished (trip.endedAt set) — stays visible whenever the
// trip is reopened afterwards, since endedAt is never cleared once set.
export function TripSummaryCard({ trip, transactions }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!trip.endedAt) return null;

  const gross = transactions
    .filter((t) => t.type === 'expense' || t.type === 'fee')
    .reduce((sum, t) => sum + t.amount, 0);
  const reimbursed = transactions
    .filter((t) => t.type === 'reimbursement')
    .reduce((sum, t) => sum + t.amount, 0);
  const net = gross - reimbursed;
  const days = Math.max(
    1,
    Math.floor((new Date(trip.endedAt).getTime() - new Date(trip.createdAt).getTime()) / MS_PER_DAY) + 1
  );
  const dailyAverage = net / days;

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>סיכום טיול</Text>
      <View style={styles.grid}>
        <View style={styles.box}>
          <Text style={styles.value}>{formatCurrency(gross)}</Text>
          <Text style={styles.label}>סה״כ הוצאתי (ברוטו)</Text>
        </View>
        <View style={styles.box}>
          <Text style={[styles.value, { color: colors.safe }]}>{formatCurrency(reimbursed)}</Text>
          <Text style={styles.label}>סה״כ קיבלתי בהחזרים</Text>
        </View>
        <View style={styles.box}>
          <Text style={[styles.value, { color: colors.accent }]}>{formatCurrency(net)}</Text>
          <Text style={styles.label}>הוצאה נטו סופית</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.value}>{days}</Text>
          <Text style={styles.label}>ימי טיול</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.value}>{formatCurrency(dailyAverage)}</Text>
          <Text style={styles.label}>ממוצע הוצאה ליום</Text>
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
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 18,
    },
    grid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 12,
    },
    box: {
      width: '47%',
      backgroundColor: colors.chipBackground,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
    },
    value: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    label: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
