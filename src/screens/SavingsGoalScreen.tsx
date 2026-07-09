import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AmountInputModal } from '../components/AmountInputModal';
import { SavingsGoalCard } from '../components/SavingsGoalCard';
import { isFirebaseConfigured } from '../firebase';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../hooks/useBudget';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { useSavingsGoal } from '../hooks/useSavingsGoal';
import { ThemeColors, useTheme } from '../theme';
import { isSameMonth } from '../utils';

interface Props {
  onBack: () => void;
}

export function SavingsGoalScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const firestoreBudget = useBudget(user?.uid ?? null);
  const firestoreSavingsGoal = useSavingsGoal(user?.uid ?? null);
  const firestoreSettings = useAppSettings(user?.uid ?? null);
  const demo = useDemoBudgetData();
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);

  const { expenses, budget, savingsGoal, monthStartDay, updateSavingsGoal, loaded } = isFirebaseConfigured
    ? {
        expenses: firestoreExpenses.expenses,
        budget: firestoreBudget.budget,
        savingsGoal: firestoreSavingsGoal.savingsGoal,
        monthStartDay: firestoreSettings.monthStartDay,
        updateSavingsGoal: firestoreSavingsGoal.updateSavingsGoal,
        loaded: firestoreExpenses.loaded && firestoreBudget.loaded,
      }
    : {
        expenses: demo.expenses,
        budget: demo.budget,
        savingsGoal: demo.savingsGoal,
        monthStartDay: demo.monthStartDay,
        updateSavingsGoal: demo.updateSavingsGoal,
        loaded: true,
      };

  const monthlySpent = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date, new Date(), monthStartDay)).reduce((sum, e) => sum + e.amount, 0),
    [expenses, monthStartDay]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>יעד חיסכון</Text>
          {!isFirebaseConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>מצב הדגמה</Text>
            </View>
          )}
        </View>

        {isFirebaseConfigured && !user ? (
          <View style={styles.messageContainer}>
            <Ionicons name="lock-closed-outline" size={44} color={colors.subtext} />
            <Text style={styles.messageTitle}>יש להתחבר כדי לראות את הנתונים</Text>
            <Text style={styles.messageSubtitle}>לחצו על אייקון הפרופיל כדי להתחבר או להירשם</Text>
          </View>
        ) : !loaded ? (
          <View style={styles.messageContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <SavingsGoalCard
            goal={savingsGoal}
            budget={budget}
            spent={monthlySpent}
            onEditGoal={() => setSavingsModalVisible(true)}
          />
        )}
      </ScrollView>

      <AmountInputModal
        visible={savingsModalVisible}
        title="הגדרת יעד חיסכון"
        placeholder="לדוגמה: 500"
        initialValue={savingsGoal}
        onClose={() => setSavingsModalVisible(false)}
        onSave={updateSavingsGoal}
      />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
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
    backButton: {
      borderRadius: 10,
      padding: 4,
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
      color: '#000000',
      fontSize: 11,
      fontWeight: '700',
    },
    messageContainer: {
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
  });
}
