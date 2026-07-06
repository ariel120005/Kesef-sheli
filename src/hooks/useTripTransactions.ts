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
import { TripTransaction, TripTransactionType } from '../types';

export function useTripTransactions(uid: string | null, tripId: string | null) {
  const [transactions, setTransactions] = useState<TripTransaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !tripId || !db) {
      setTransactions([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const transactionsQuery = query(
      collection(db, 'users', uid, 'trips', tripId, 'transactions'),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<TripTransaction, 'id'>),
          }))
        );
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid, tripId]);

  const addTransaction = useCallback(
    async (type: TripTransactionType, amount: number, note: string) => {
      if (!uid || !tripId || !db) return;
      await addDoc(collection(db, 'users', uid, 'trips', tripId, 'transactions'), {
        type,
        amount,
        note,
        date: new Date().toISOString(),
      });
    },
    [uid, tripId]
  );

  const updateTransaction = useCallback(
    async (id: string, type: TripTransactionType, amount: number, note: string) => {
      if (!uid || !tripId || !db) return;
      await updateDoc(doc(db, 'users', uid, 'trips', tripId, 'transactions', id), {
        type,
        amount,
        note,
      });
    },
    [uid, tripId]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!uid || !tripId || !db) return;
      await deleteDoc(doc(db, 'users', uid, 'trips', tripId, 'transactions', id));
    },
    [uid, tripId]
  );

  return { transactions, loaded, addTransaction, updateTransaction, deleteTransaction };
}
