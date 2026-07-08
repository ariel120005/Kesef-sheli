import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { FALLBACK_CATEGORY_COLOR, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Expense } from '../types';
import { formatCurrency, isSameMonth } from '../utils';

interface Props {
  expenses: Expense[];
  categoryColors: Record<string, string>;
  monthStartDay?: number;
}

const SIZE = 176;
const STROKE_WIDTH = 26;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CategoryDonutChart({ expenses, categoryColors, monthStartDay = 1 }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { rows, monthTotal } = useMemo(() => {
    const totals = new Map<string, number>();
    let total = 0;
    for (const e of expenses) {
      if (!isSameMonth(e.date, new Date(), monthStartDay)) continue;
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
      total += e.amount;
    }
    const rows = Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    return { rows, monthTotal: total };
  }, [expenses, monthStartDay]);

  let cumulativePercent = 0;

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>התפלגות הוצאות</Text>

      {rows.length === 0 ? (
        <Text style={styles.emptyText}>אין הוצאות החודש</Text>
      ) : (
        <>
          <View style={styles.chartRow}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={colors.chipBackground}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                {rows.map((row) => {
                  const segmentLength = (row.percent / 100) * CIRCUMFERENCE;
                  const offset = (cumulativePercent / 100) * CIRCUMFERENCE;
                  cumulativePercent += row.percent;
                  return (
                    <Circle
                      key={row.category}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={RADIUS}
                      stroke={categoryColors[row.category] ?? FALLBACK_CATEGORY_COLOR}
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={`${segmentLength} ${CIRCUMFERENCE - segmentLength}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                      fill="none"
                    />
                  );
                })}
              </G>
            </Svg>
            <View style={styles.centerLabel} pointerEvents="none">
              <Text style={styles.centerAmount}>{formatCurrency(monthTotal)}</Text>
              <Text style={styles.centerSubtitle}>סה״כ החודש</Text>
            </View>
          </View>

          <View style={styles.legend}>
            {rows.map((row) => (
              <View key={row.category} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: categoryColors[row.category] ?? FALLBACK_CATEGORY_COLOR },
                  ]}
                />
                <Text style={styles.legendLabel}>{row.category}</Text>
                <Text style={styles.legendPercent}>{row.percent.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </>
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
    chartRow: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    centerLabel: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerAmount: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    centerSubtitle: {
      color: colors.subtext,
      fontSize: 11,
      marginTop: 2,
    },
    legend: {
      gap: 10,
    },
    legendRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
    },
    legendPercent: {
      color: colors.subtext,
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
