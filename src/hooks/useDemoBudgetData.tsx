import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_BUDGET, DEMO_EXPENSES, DEMO_SAVINGS_GOAL } from '../demoData';
import { findMissingRecurringInstances } from '../recurring';
import { Category, Currency, Expense } from '../types';

interface DemoBudgetData {
  expenses: Expense[];
  budget: number | null;
  savingsGoal: number | null;
  addExpense: (
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount?: number | null,
    originalCurrency?: Currency | null
  ) => void;
  updateExpense: (
    id: string,
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount?: number | null,
    originalCurrency?: Currency | null
  ) => void;
  deleteExpense: (id: string) => void;
  updateBudget: (value: number) => void;
  updateSavingsGoal: (value: number) => void;
}

const DemoBudgetDataContext = createContext<DemoBudgetData | undefined>(undefined);

// Home (budget + expense entry) and the Savings Goal / Insights screens all need the same
// in-memory demo numbers to stay in sync now that they're separate screens, so this state lives
// in one shared provider instead of being duplicated per screen.
export function DemoBudgetDataProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <DemoBudgetDataContext.Provider
      value={{
        expenses,
        budget,
        savingsGoal,
        addExpense,
        updateExpense,
        deleteExpense,
        updateBudget: setBudget,
        updateSavingsGoal: setSavingsGoal,
      }}
    >
      {children}
    </DemoBudgetDataContext.Provider>
  );
}

export function useDemoBudgetData() {
  const ctx = useContext(DemoBudgetDataContext);
  if (!ctx) throw new Error('useDemoBudgetData must be used within a DemoBudgetDataProvider');
  return ctx;
}
