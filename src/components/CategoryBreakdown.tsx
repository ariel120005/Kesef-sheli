import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { Expense } from '../types';
import { formatCurrency, isSameMonth } from '../utils';

interface Props {
  expenses: Expense[];
}

export function CategoryBreakdown({ expenses }: Props) {
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
    <View style={styles.card}>
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
              <View style={[styles.barFill, { width: `${row.percent}%` }]} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.subtext,
    textAlign: 'right',
  },
  row: {
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  category: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
