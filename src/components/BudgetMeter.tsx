import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, GRADIENTS, SHADOW } from '../constants';
import { formatCurrency } from '../utils';

interface Props {
  budget: number | null;
  spent: number;
  onEditBudget: () => void;
}

export function BudgetMeter({ budget, spent, onEditBudget }: Props) {
  if (budget === null) {
    return (
      <View style={[styles.card, SHADOW]}>
        <Text style={styles.title}>תקציב חודשי</Text>
        <Text style={styles.emptyText}>עדיין לא הגדרת תקציב לחודש הזה</Text>
        <Pressable onPress={onEditBudget}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.setButton}
          >
            <Text style={styles.setButtonText}>הגדרת תקציב</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const ratio = budget > 0 ? spent / budget : 0;
  const zone = ratio >= 1 ? 'over' : ratio >= 0.7 ? 'warning' : 'safe';
  const zoneColor = COLORS[zone];
  const barGradient = GRADIENTS[zone];
  const fillPercent = Math.min(ratio, 1) * 100;
  const remaining = budget - spent;

  return (
    <View style={[styles.card, SHADOW]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>תקציב חודשי</Text>
        <Pressable onPress={onEditBudget}>
          <Text style={styles.editLink}>עריכה</Text>
        </Pressable>
      </View>

      <View style={styles.barTrack}>
        <LinearGradient
          colors={barGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={[styles.barFill, { width: `${fillPercent}%` }]}
        />
      </View>

      <View style={styles.amountsRow}>
        <Text style={styles.spentText}>
          {formatCurrency(spent)} מתוך {formatCurrency(budget)}
        </Text>
        <Text style={[styles.remainingText, { color: zoneColor }]}>
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
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
  },
  editLink: {
    color: COLORS.turquoise,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.subtext,
    textAlign: 'right',
    marginBottom: 18,
    lineHeight: 20,
  },
  setButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  setButtonText: {
    color: '#0A0A0F',
    fontWeight: '700',
    fontSize: 15,
  },
  barTrack: {
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  amountsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  spentText: {
    color: COLORS.subtext,
    fontSize: 13,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
