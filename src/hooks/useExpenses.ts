import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import { Category, Expense } from '../types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.expenses)
      .then((raw) => {
        if (raw) setExpenses(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    AsyncStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(next));
  }, []);

  const addExpense = useCallback(
    (amount: number, category: Category, note: string) => {
      const expense: Expense = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount,
        category,
        note,
        date: new Date().toISOString(),
      };
      persist([expense, ...expenses]);
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  return { expenses, loaded, addExpense, deleteExpense };
}
