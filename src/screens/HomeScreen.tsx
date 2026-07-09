import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { AmountInputModal } from '../components/AmountInputModal';
import { BudgetMeter } from '../components/BudgetMeter';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { ExpenseList } from '../components/ExpenseList';
import { isFirebaseConfigured } from '../firebase';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useBudget } from '../hooks/useBudget';
import { useCategories } from '../hooks/useCategories';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';
import { Expense } from '../types';
import { isSameMonth } from '../utils';

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const firestoreExpenses = useExpenses(user?.uid ?? null);
  const firestoreBudget = useBudget(user?.uid ?? null);
  const firestoreCategories = useCategories(user?.uid ?? null);
  const firestoreSettings = useAppSettings(user?.uid ?? null);
  const demo = useDemoBudgetData();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const {
    expenses,
    budget,
    categories,
    defaultCurrency,
    monthStartDay,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudget,
    expensesLoaded,
    budgetLoaded,
  } = isFirebaseConfigured
    ? {
        expenses: firestoreExpenses.expenses,
        budget: firestoreBudget.budget,
        categories: firestoreCategories.categories,
        defaultCurrency: firestoreSettings.defaultCurrency,
        monthStartDay: firestoreSettings.monthStartDay,
        addExpense: firestoreExpenses.addExpense,
        updateExpense: firestoreExpenses.updateExpense,
        deleteExpense: firestoreExpenses.deleteExpense,
        updateBudget: firestoreBudget.updateBudget,
        expensesLoaded: firestoreExpenses.loaded,
        budgetLoaded: firestoreBudget.loaded,
      }
    : {
        expenses: demo.expenses,
        budget: demo.budget,
        categories: demo.categories,
        defaultCurrency: demo.defaultCurrency,
        monthStartDay: demo.monthStartDay,
        addExpense: demo.addExpense,
        updateExpense: demo.updateExpense,
        deleteExpense: demo.deleteExpense,
        updateBudget: demo.updateBudget,
        expensesLoaded: true,
        budgetLoaded: true,
      };

  const monthlySpent = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date, new Date(), monthStartDay)).reduce((sum, e) => sum + e.amount, 0),
    [expenses, monthStartDay]
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

  if (!expensesLoaded || !budgetLoaded) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>הכסף של בוקי</Text>
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

        <AddExpenseForm categories={categories} defaultCurrency={defaultCurrency} onAdd={addExpense} />

        <CategoryBreakdown expenses={expenses} monthStartDay={monthStartDay} />

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

      <EditExpenseModal
        expense={editingExpense}
        categories={categories}
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
      color: '#000000',
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
