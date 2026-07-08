import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';
import { Trip } from '../types';

export function useTrips(uid: string | null) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setTrips([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const tripsQuery = query(collection(db, 'users', uid, 'trips'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        setTrips(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Trip, 'id'>),
          }))
        );
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const addTrip = useCallback(
    async (name: string, budget: number) => {
      if (!uid || !db) return;
      await addDoc(collection(db, 'users', uid, 'trips'), {
        name,
        budget,
        createdAt: new Date().toISOString(),
      });
    },
    [uid]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      if (!uid || !db) return;
      // Firestore doesn't cascade-delete subcollections, so clear the trip's
      // transactions first.
      const transactionsSnapshot = await getDocs(collection(db, 'users', uid, 'trips', id, 'transactions'));
      const batch = writeBatch(db);
      transactionsSnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'users', uid, 'trips', id));
    },
    [uid]
  );

  const endTrip = useCallback(
    async (id: string) => {
      if (!uid || !db) return;
      await updateDoc(doc(db, 'users', uid, 'trips', id), { endedAt: new Date().toISOString() });
    },
    [uid]
  );

  return { trips, loaded, addTrip, deleteTrip, endTrip };
}
