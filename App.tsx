import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AddExpenseForm } from './src/components/AddExpenseForm';
import { BudgetMeter } from './src/components/BudgetMeter';
import { CategoryBreakdown } from './src/components/CategoryBreakdown';
import { ExpenseList } from './src/components/ExpenseList';
import { SetBudgetModal } from './src/components/SetBudgetModal';
import { COLORS } from './src/constants';
import { useBudget } from './src/hooks/useBudget';
import { useExpenses } from './src/hooks/useExpenses';
import { isSameMonth } from './src/utils';

export default function App() {
  const { expenses, loaded: expensesLoaded, addExpense, deleteExpense } = useExpenses();
  const { budget, loaded: budgetLoaded, updateBudget } = useBudget();
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  const monthlySpent = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  if (!expensesLoaded || !budgetLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
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
