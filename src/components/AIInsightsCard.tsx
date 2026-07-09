import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { generateInsights } from '../insights';
import { ThemeColors, useTheme } from '../theme';
import { Expense } from '../types';

interface Props {
  expenses: Expense[];
  budget: number | null;
  monthStartDay?: number;
}

export function AIInsightsCard({ expenses, budget, monthStartDay = 1 }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const insights = useMemo(
    () => generateInsights(expenses, budget, monthStartDay),
    [expenses, budget, monthStartDay]
  );

  return (
    <View style={[styles.card, SHADOW]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>תובנות</Text>
        <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
      </View>

      {insights.map((insight, index) => (
        <View key={index} style={styles.insightRow}>
          <Text style={styles.insightText}>{insight}</Text>
          <View style={styles.bullet} />
        </View>
      ))}
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
    titleRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    insightRow: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginTop: 7,
    },
    insightText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      textAlign: 'right',
      lineHeight: 20,
    },
  });
}
