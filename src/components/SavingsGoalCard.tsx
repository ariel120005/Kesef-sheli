import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { formatCurrency } from '../utils';

interface Props {
  goal: number | null;
  budget: number | null;
  spent: number;
  onEditGoal: () => void;
}

export function SavingsGoalCard({ goal, budget, spent, onEditGoal }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (goal === null) {
    return (
      <View style={[styles.card, SHADOW]}>
        <Text style={styles.title}>יעד חיסכון</Text>
        <Text style={styles.emptyText}>עדיין לא הגדרתם יעד חיסכון לחודש הזה</Text>
        <Pressable onPress={onEditGoal}>
          <LinearGradient
            colors={GRADIENTS.safe}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.setButton}
          >
            <Text style={styles.setButtonText}>הגדרת יעד חיסכון</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const saved = budget !== null ? Math.max(budget - spent, 0) : 0;
  const ratio = goal > 0 ? saved / goal : 0;
  const fillPercent = Math.min(ratio, 1) * 100;
  const achieved = saved >= goal;

  return (
    <View style={[styles.card, SHADOW]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>יעד חיסכון</Text>
        <Pressable onPress={onEditGoal}>
          <Text style={styles.editLink}>עריכה</Text>
        </Pressable>
      </View>

      {budget === null ? (
        <Text style={styles.emptyText}>הגדירו תקציב חודשי כדי לעקוב אחרי ההתקדמות</Text>
      ) : (
        <>
          <View style={styles.barTrack}>
            <LinearGradient
              colors={GRADIENTS.safe}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={[styles.barFill, { width: `${fillPercent}%` }]}
            />
          </View>

          <View style={styles.amountsRow}>
            <Text style={styles.savedText}>
              {formatCurrency(saved)} מתוך {formatCurrency(goal)}
            </Text>
            {achieved && <Text style={styles.achievedText}>היעד הושג</Text>}
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
    headerRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    editLink: {
      color: colors.turquoise,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyText: {
      color: colors.subtext,
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
      backgroundColor: colors.chipBackground,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 8,
    },
    amountsRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
    },
    savedText: {
      color: colors.subtext,
      fontSize: 13,
    },
    achievedText: {
      color: colors.safe,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
