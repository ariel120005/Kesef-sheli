import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { BudgetMeter } from '../components/BudgetMeter';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ExpenseList } from '../components/ExpenseList';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';
import { isSameMonth } from '../utils';

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const { expenses, loaded: expensesLoaded, addExpense, deleteExpense } = useExpenses(
    user?.uid ?? null
  );
  const { budget, loaded: budgetLoaded, updateBudget } = useBudget(user?.uid ?? null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  const monthlySpent = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.messageContainer}>
        <Ionicons name="cloud-offline-outline" size={44} color={colors.subtext} />
        <Text style={styles.messageTitle}>Firebase לא מוגדר</Text>
        <Text style={styles.messageSubtitle}>הוסיפו את פרטי ה-Firebase לקובץ .env</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.messageContainer}>
        <Ionicons name="lock-closed-outline" size={44} color={colors.subtext} />
        <Text style={styles.messageTitle}>יש להתחבר כדי לראות את הנתונים</Text>
        <Text style={styles.messageSubtitle}>עברו לטאב "פרופיל" כדי להתחבר או להירשם</Text>
      </View>
    );
  }

  if (!expensesLoaded || !budgetLoaded) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>כסף שלי</Text>

        <BudgetMeter
          budget={budget}
          spent={monthlySpent}
          onEditBudget={() => setBudgetModalVisible(true)}
        />

        <AddExpenseForm onAdd={addExpense} />

        <CategoryBreakdown expenses={expenses} />

        <ExpenseList expenses={expenses} onDelete={deleteExpense} />
      </ScrollView>

      <SetBudgetModal
        visible={budgetModalVisible}
        initialValue={budget}
        onClose={() => setBudgetModalVisible(false)}
        onSave={updateBudget}
      />
    </View>
  );
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
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 24,
      letterSpacing: 0.2,
    },
  });
}
