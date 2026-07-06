import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AIInsightsCard } from '../components/AIInsightsCard';
import { CategoryDonutChart } from '../components/CategoryDonutChart';
import { SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../hooks/useBudget';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { useSavingsGoal } from '../hooks/useSavingsGoal';
import { ThemeColors, useTheme } from '../theme';
import { formatCurrency, isSameMonth } from '../utils';

interface Props {
  onOpenTrips: () => void;
  onOpenSavingsGoal: () => void;
}

export function InsightsScreen({ onOpenTrips, onOpenSavingsGoal }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const firestoreBudget = useBudget(user?.uid ?? null);
  const firestoreSavingsGoal = useSavingsGoal(user?.uid ?? null);
  const demo = useDemoBudgetData();

  const { expenses, budget, savingsGoal, loaded } = isFirebaseConfigured
    ? {
        expenses: firestoreExpenses.expenses,
        budget: firestoreBudget.budget,
        savingsGoal: firestoreSavingsGoal.savingsGoal,
        loaded: firestoreExpenses.loaded && firestoreBudget.loaded,
      }
    : {
        expenses: demo.expenses,
        budget: demo.budget,
        savingsGoal: demo.savingsGoal,
        loaded: true,
      };

  const monthlySpent = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  if (isFirebaseConfigured && !user) {
    return (
      <View style={styles.messageContainer}>
        <Ionicons name="lock-closed-outline" size={44} color={colors.subtext} />
        <Text style={styles.messageTitle}>יש להתחבר כדי לראות את הנתונים</Text>
        <Text style={styles.messageSubtitle}>לחצו על אייקון הפרופיל כדי להתחבר או להירשם</Text>
      </View>
    );
  }

  if (!loaded) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const saved = budget !== null ? Math.max(budget - monthlySpent, 0) : 0;
  const savingsSubtitle =
    savingsGoal === null ? 'טרם הוגדר יעד חיסכון' : `${formatCurrency(saved)} מתוך ${formatCurrency(savingsGoal)}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>תובנות</Text>
          {!isFirebaseConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>מצב הדגמה</Text>
            </View>
          )}
        </View>

        <AIInsightsCard expenses={expenses} budget={budget} />

        <CategoryDonutChart expenses={expenses} />

        <ShortcutCard
          icon="wallet-outline"
          title="יעד חיסכון"
          subtitle={savingsSubtitle}
          onPress={onOpenSavingsGoal}
        />

        <ShortcutCard
          icon="airplane-outline"
          title="טיולים"
          subtitle="נהלו תקציב נפרד לכל טיול"
          onPress={onOpenTrips}
        />
      </ScrollView>
    </View>
  );
}

function ShortcutCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = getShortcutStyles(colors);

  return (
    <Pressable style={[styles.card, SHADOW]} onPress={onPress}>
      <Ionicons name="chevron-back" size={20} color={colors.subtext} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={colors.turquoise} />
      </View>
    </Pressable>
  );
}

function getShortcutStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.chipBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    subtitle: {
      fontSize: 12,
      color: colors.subtext,
      textAlign: 'right',
      marginTop: 2,
    },
  });
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    messageContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    messageTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    messageSubtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
    },
    content: {
      padding: 22,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    demoBadge: {
      backgroundColor: colors.warning,
      borderRadius: 20,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    demoBadgeText: {
      color: '#0A0A0F',
      fontSize: 11,
      fontWeight: '700',
    },
  });
}
