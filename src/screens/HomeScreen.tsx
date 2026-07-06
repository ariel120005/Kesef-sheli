import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { BudgetMeter } from '../components/BudgetMeter';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ExpenseList } from '../components/ExpenseList';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { DEMO_BUDGET, DEMO_EXPENSES } from '../demoData';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';
import { Category, Expense } from '../types';
import { isSameMonth } from '../utils';

function useDemoData() {
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [budget, setBudget] = useState<number | null>(DEMO_BUDGET);

  const addExpense = (amount: number, category: Category, note: string) => {
    setExpenses((prev) => [
      { id: `demo-${Date.now()}`, amount, category, note, date: new Date().toISOString() },
      ...prev,
    ]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return { expenses, budget, addExpense, deleteExpense, updateBudget: setBudget };
}

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const firestoreBudget = useBudget(user?.uid ?? null);
  const demo = useDemoData();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  const { expenses, budget, addExpense, deleteExpense, updateBudget, expensesLoaded, budgetLoaded } =
    isFirebaseConfigured
      ? {
          expenses: firestoreExpenses.expenses,
          budget: firestoreBudget.budget,
          addExpense: firestoreExpenses.addExpense,
          deleteExpense: firestoreExpenses.deleteExpense,
          updateBudget: firestoreBudget.updateBudget,
          expensesLoaded: firestoreExpenses.loaded,
          budgetLoaded: firestoreBudget.loaded,
        }
      : {
          expenses: demo.expenses,
          budget: demo.budget,
          addExpense: demo.addExpense,
          deleteExpense: demo.deleteExpense,
          updateBudget: demo.updateBudget,
          expensesLoaded: true,
          budgetLoaded: true,
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
        <View style={styles.headerRow}>
          <Text style={styles.header}>כסף שלי</Text>
          {!isFirebaseConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>מצב הדגמה</Text>
            </View>
          )}
        </View>

        {!isFirebaseConfigured && (
          <Text style={styles.demoNotice}>
            הנתונים כאן הם לדוגמה בלבד ולא נשמרים — התחברו כדי לעבוד עם נתונים אמיתיים
          </Text>
        )}

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
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
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
    demoNotice: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'right',
      marginBottom: 24,
    },
  });
}
