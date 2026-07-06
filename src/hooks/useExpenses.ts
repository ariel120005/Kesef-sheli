import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';
import { findMissingRecurringInstances } from '../recurring';
import { Category, Currency, Expense } from '../types';

export function useExpenses(uid: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setExpenses([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const expensesQuery = query(collection(db, 'users', uid, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        setExpenses(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Expense, 'id'>),
          }))
        );
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const addExpense = useCallback(
    async (
      amount: number,
      category: Category,
      note: string,
      recurring: boolean,
      originalAmount: number | null = null,
      originalCurrency: Currency | null = null
    ) => {
      if (!uid || !db) return;
      await addDoc(collection(db, 'users', uid, 'expenses'), {
        amount,
        category,
        note,
        date: new Date().toISOString(),
        recurring,
        originalAmount,
        originalCurrency,
      });
    },
    [uid]
  );

  const updateExpense = useCallback(
    async (
      id: string,
      amount: number,
      category: Category,
      note: string,
      recurring: boolean,
      originalAmount: number | null = null,
      originalCurrency: Currency | null = null
    ) => {
      if (!uid || !db) return;
      await updateDoc(doc(db, 'users', uid, 'expenses', id), {
        amount,
        category,
        note,
        recurring,
        originalAmount,
        originalCurrency,
      });
    },
    [uid]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!uid || !db) return;
      await deleteDoc(doc(db, 'users', uid, 'expenses', id));
    },
    [uid]
  );

  // Auto-log this month's copy of any recurring expense that hasn't been logged yet.
  useEffect(() => {
    if (!loaded || !uid || !db) return;
    const firestore = db;
    const missing = findMissingRecurringInstances(expenses);
    for (const template of missing) {
      addDoc(collection(firestore, 'users', uid, 'expenses'), {
        amount: template.amount,
        category: template.category,
        note: template.note,
        date: new Date().toISOString(),
        recurring: true,
      });
    }
  }, [expenses, loaded, uid]);

  return { expenses, loaded, addExpense, updateExpense, deleteExpense };
}
