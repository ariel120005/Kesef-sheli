import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { AIInsightsCard } from '../components/AIInsightsCard';
import { AmountInputModal } from '../components/AmountInputModal';
import { BudgetMeter } from '../components/BudgetMeter';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ExpenseList } from '../components/ExpenseList';
import { SavingsGoalCard } from '../components/SavingsGoalCard';
import { DEMO_BUDGET, DEMO_EXPENSES, DEMO_SAVINGS_GOAL } from '../demoData';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { useSavingsGoal } from '../hooks/useSavingsGoal';
import { findMissingRecurringInstances } from '../recurring';
import { ThemeColors, useTheme } from '../theme';
import { Category, Currency, Expense } from '../types';
import { isSameMonth } from '../utils';

function useDemoData() {
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [budget, setBudget] = useState<number | null>(DEMO_BUDGET);
  const [savingsGoal, setSavingsGoal] = useState<number | null>(DEMO_SAVINGS_GOAL);

  const addExpense = (
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount: number | null = null,
    originalCurrency: Currency | null = null
  ) => {
    setExpenses((prev) => [
      {
        id: `demo-${Date.now()}`,
        amount,
        category,
        note,
        date: new Date().toISOString(),
        recurring,
        originalAmount,
        originalCurrency,
      },
      ...prev,
    ]);
  };

  const updateExpense = (
    id: string,
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount: number | null = null,
    originalCurrency: Currency | null = null
  ) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, amount, category, note, recurring, originalAmount, originalCurrency } : e
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Auto-log this month's copy of any recurring demo expense, same as the real Firestore hook.
  useEffect(() => {
    const missing = findMissingRecurringInstances(expenses);
    if (missing.length === 0) return;
    setExpenses((prev) => [
      ...missing.map((template) => ({
        id: `demo-${Date.now()}-${template.id}`,
        amount: template.amount,
        category: template.category,
        note: template.note,
        date: new Date().toISOString(),
        recurring: true,
      })),
      ...prev,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  return {
    expenses,
    budget,
    savingsGoal,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudget: setBudget,
    updateSavingsGoal: setSavingsGoal,
  };
}

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const firestoreBudget = useBudget(user?.uid ?? null);
  const firestoreSavingsGoal = useSavingsGoal(user?.uid ?? null);
  const demo = useDemoData();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const {
    expenses,
    budget,
    savingsGoal,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudget,
    updateSavingsGoal,
    expensesLoaded,
    budgetLoaded,
  } = isFirebaseConfigured
    ? {
        expenses: firestoreExpenses.expenses,
        budget: firestoreBudget.budget,
        savingsGoal: firestoreSavingsGoal.savingsGoal,
        addExpense: firestoreExpenses.addExpense,
        updateExpense: firestoreExpenses.updateExpense,
        deleteExpense: firestoreExpenses.deleteExpense,
        updateBudget: firestoreBudget.updateBudget,
        updateSavingsGoal: firestoreSavingsGoal.updateSavingsGoal,
        expensesLoaded: firestoreExpenses.loaded,
        budgetLoaded: firestoreBudget.loaded,
      }
    : {
        expenses: demo.expenses,
        budget: demo.budget,
        savingsGoal: demo.savingsGoal,
        addExpense: demo.addExpense,
        updateExpense: demo.updateExpense,
        deleteExpense: demo.deleteExpense,
        updateBudget: demo.updateBudget,
        updateSavingsGoal: demo.updateSavingsGoal,
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

        <SavingsGoalCard
          goal={savingsGoal}
          budget={budget}
          spent={monthlySpent}
          onEditGoal={() => setSavingsModalVisible(true)}
        />

        <AddExpenseForm onAdd={addExpense} />

        <AIInsightsCard expenses={expenses} budget={budget} />

        <CategoryBreakdown expenses={expenses} />

        <ExpenseList expenses={expenses} onDelete={deleteExpense} onEdit={setEditingExpense} />
      </ScrollView>

      <AmountInputModal
        visible={budgetModalVisible}
        title="הגדרת תקציב חודשי"
        placeholder="לדוגמה: 5000"
        initialValue={budget}
        onClose={() => setBudgetModalVisible(false)}
        onSave={updateBudget}
      />

      <AmountInputModal
        visible={savingsModalVisible}
        title="הגדרת יעד חיסכון"
        placeholder="לדוגמה: 500"
        initialValue={savingsGoal}
        onClose={() => setSavingsModalVisible(false)}
        onSave={updateSavingsGoal}
      />

      <EditExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={updateExpense}
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
