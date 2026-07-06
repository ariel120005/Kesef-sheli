import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { BudgetMeter } from '../components/BudgetMeter';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ExpenseList } from '../components/ExpenseList';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { COLORS } from '../constants';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { isSameMonth } from '../utils';

export function HomeScreen() {
  const { expenses, loaded: expensesLoaded, addExpense, deleteExpense } = useExpenses();
  const { budget, loaded: budgetLoaded, updateBudget } = useBudget();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  const monthlySpent = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  if (!expensesLoaded || !budgetLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 24,
    letterSpacing: 0.2,
  },
});
