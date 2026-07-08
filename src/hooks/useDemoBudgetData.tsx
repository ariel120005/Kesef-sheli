import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_BUDGET, DEMO_CATEGORIES, DEMO_EXPENSES, DEMO_SAVINGS_GOAL } from '../demoData';
import { PRESET_NOTIFICATION_SOURCES } from '../notificationFilter';
import { findMissingRecurringInstances } from '../recurring';
import { Category, CategoryDef, Currency, Expense, NotificationSource } from '../types';

const DEMO_NOTIFICATION_SOURCES: NotificationSource[] = PRESET_NOTIFICATION_SOURCES.map((preset, index) => ({
  id: `demo-preset-${index}`,
  packageName: preset.packageName,
  label: preset.label,
  enabled: false,
  isPreset: true,
}));

interface DemoBudgetData {
  expenses: Expense[];
  budget: number | null;
  savingsGoal: number | null;
  categories: CategoryDef[];
  defaultCurrency: Currency | 'ILS';
  monthStartDay: number;
  notificationSources: NotificationSource[];
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
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  updateDefaultCurrency: (value: Currency | 'ILS') => void;
  updateMonthStartDay: (value: number) => void;
  toggleNotificationSource: (id: string, enabled: boolean) => void;
  addNotificationSource: (packageName: string, label: string) => void;
  removeNotificationSource: (id: string) => void;
  resetAllData: () => void;
}

const DemoBudgetDataContext = createContext<DemoBudgetData | undefined>(undefined);

// Home (budget + expense entry) and the Savings Goal / Insights screens all need the same
// in-memory demo numbers to stay in sync now that they're separate screens, so this state lives
// in one shared provider instead of being duplicated per screen.
export function DemoBudgetDataProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [budget, setBudget] = useState<number | null>(DEMO_BUDGET);
  const [savingsGoal, setSavingsGoal] = useState<number | null>(DEMO_SAVINGS_GOAL);
  const [categories, setCategories] = useState<CategoryDef[]>(DEMO_CATEGORIES);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | 'ILS'>('ILS');
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [notificationSources, setNotificationSources] = useState<NotificationSource[]>(
    DEMO_NOTIFICATION_SOURCES
  );

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

  const addCategory = (name: string, color: string) => {
    setCategories((prev) => [...prev, { id: `demo-cat-${Date.now()}`, name, color }]);
  };

  const updateCategory = (id: string, name: string, color: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name, color } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleNotificationSource = (id: string, enabled: boolean) => {
    setNotificationSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled } : s)));
  };

  const addNotificationSource = (packageName: string, label: string) => {
    setNotificationSources((prev) => [
      ...prev,
      { id: `demo-custom-${Date.now()}`, packageName, label, enabled: false, isPreset: false },
    ]);
  };

  const removeNotificationSource = (id: string) => {
    setNotificationSources((prev) => prev.filter((s) => s.id !== id));
  };

  const resetAllData = () => {
    setExpenses([]);
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
        categories,
        defaultCurrency,
        monthStartDay,
        notificationSources,
        addExpense,
        updateExpense,
        deleteExpense,
        updateBudget: setBudget,
        updateSavingsGoal: setSavingsGoal,
        addCategory,
        updateCategory,
        deleteCategory,
        updateDefaultCurrency: setDefaultCurrency,
        updateMonthStartDay: setMonthStartDay,
        toggleNotificationSource,
        addNotificationSource,
        removeNotificationSource,
        resetAllData,
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
