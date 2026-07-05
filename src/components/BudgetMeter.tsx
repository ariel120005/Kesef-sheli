import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils';

interface Props {
  budget: number | null;
  spent: number;
  onEditBudget: () => void;
}

export function BudgetMeter({ budget, spent, onEditBudget }: Props) {
  if (budget === null) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>תקציב חודשי</Text>
        <Text style={styles.emptyText}>עדיין לא הגדרת תקציב לחודש הזה</Text>
        <Pressable style={styles.setButton} onPress={onEditBudget}>
          <Text style={styles.setButtonText}>הגדרת תקציב</Text>
        </Pressable>
      </View>
    );
  }

  const ratio = budget > 0 ? spent / budget : 0;
  const barColor = ratio >= 1 ? COLORS.over : ratio >= 0.7 ? COLORS.warning : COLORS.safe;
  const fillPercent = Math.min(ratio, 1) * 100;
  const remaining = budget - spent;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>תקציב חודשי</Text>
        <Pressable onPress={onEditBudget}>
          <Text style={styles.editLink}>עריכה</Text>
        </Pressable>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${fillPercent}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.amountsRow}>
        <Text style={styles.spentText}>
          {formatCurrency(spent)} מתוך {formatCurrency(budget)}
        </Text>
        <Text style={[styles.remainingText, { color: barColor }]}>
          {remaining >= 0
            ? `נותרו ${formatCurrency(remaining)}`
            : `חריגה של ${formatCurrency(Math.abs(remaining))}`}
        </Text>
      </View>
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
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
  },
  editLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.subtext,
    textAlign: 'right',
    marginBottom: 12,
  },
  setButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  setButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  barTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
  },
  amountsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  spentText: {
    color: COLORS.text,
    fontSize: 13,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
