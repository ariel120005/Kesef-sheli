import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';
import { Category, Expense } from '../types';

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
    async (amount: number, category: Category, note: string) => {
      if (!uid || !db) return;
      await addDoc(collection(db, 'users', uid, 'expenses'), {
        amount,
        category,
        note,
        date: new Date().toISOString(),
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

  return { expenses, loaded, addExpense, deleteExpense };
}
