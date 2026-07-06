import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Expense } from '../types';
import { formatCurrency, isSameMonth } from '../utils';

interface Props {
  expenses: Expense[];
}

export function CategoryBreakdown({ expenses }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const rows = useMemo(() => {
    const totals = new Map<string, number>();
    let monthTotal = 0;
    for (const e of expenses) {
      if (!isSameMonth(e.date)) continue;
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
      monthTotal += e.amount;
    }
    return Array.from(totals.entries())
      .map(([category, total]) => ({
        category,
        total,
        percent: monthTotal > 0 ? (total / monthTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>פירוט לפי קטגוריה</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>אין הוצאות החודש</Text>
      ) : (
        rows.map((row) => (
          <View key={row.category} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.category}>{row.category}</Text>
              <Text style={styles.amount}>{formatCurrency(row.total)}</Text>
            </View>
            <View style={styles.barTrack}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={[styles.barFill, { width: `${row.percent}%` }]}
              />
            </View>
          </View>
        ))
      )}
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
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 18,
    },
    emptyText: {
      color: colors.subtext,
      textAlign: 'right',
    },
    row: {
      marginBottom: 16,
    },
    rowHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    category: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    amount: {
      color: colors.subtext,
      fontSize: 14,
    },
    barTrack: {
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.chipBackground,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 5,
    },
  });
}
