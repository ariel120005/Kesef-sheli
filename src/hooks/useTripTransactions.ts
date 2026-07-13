import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';
import { Currency, Trip, TripTransaction, TripTransactionType } from '../types';

// A shared trip's transactions live under sharedTrips/{tripId}/transactions instead of
// users/{uid}/trips/{tripId}/transactions — see useTrips.ts. Takes the full Trip (not just its
// id) so it can tell which collection to read/write.
export function useTripTransactions(uid: string | null, trip: Trip | null) {
  const [transactions, setTransactions] = useState<TripTransaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const tripId = trip?.id ?? null;
  const isShared = !!trip?.isShared;

  const getCollectionRef = useCallback((): CollectionReference | null => {
    if (!db || !tripId) return null;
    if (isShared) return collection(db, 'sharedTrips', tripId, 'transactions');
    if (!uid) return null;
    return collection(db, 'users', uid, 'trips', tripId, 'transactions');
  }, [uid, tripId, isShared]);

  useEffect(() => {
    const collectionRef = getCollectionRef();
    if (!collectionRef) {
      setTransactions([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const transactionsQuery = query(collectionRef, orderBy('date', 'desc'));
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
  }, [getCollectionRef]);

  const addTransaction = useCallback(
    async (
      type: TripTransactionType,
      amount: number,
      note: string,
      originalAmount: number | null = null,
      originalCurrency: Currency | null = null,
      paidByUid: string | null = null,
      splitAmongUids: string[] | null = null
    ) => {
      const collectionRef = getCollectionRef();
      if (!collectionRef) return;
      await addDoc(collectionRef, {
        type,
        amount,
        note,
        date: new Date().toISOString(),
        originalAmount,
        originalCurrency,
        paidByUid,
        splitAmongUids,
      });
    },
    [getCollectionRef]
  );

  // Split settings (paidByUid/splitAmongUids) are intentionally not editable after creation —
  // this only ever touches the fields the edit modal actually exposes.
  const updateTransaction = useCallback(
    async (
      id: string,
      type: TripTransactionType,
      amount: number,
      note: string,
      originalAmount: number | null = null,
      originalCurrency: Currency | null = null
    ) => {
      const collectionRef = getCollectionRef();
      if (!collectionRef) return;
      await updateDoc(doc(collectionRef, id), { type, amount, note, originalAmount, originalCurrency });
    },
    [getCollectionRef]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const collectionRef = getCollectionRef();
      if (!collectionRef) return;
      await deleteDoc(doc(collectionRef, id));
    },
    [getCollectionRef]
  );

  return { transactions, loaded, addTransaction, updateTransaction, deleteTransaction };
}
