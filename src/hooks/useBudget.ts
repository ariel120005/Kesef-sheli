import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';

export function useBudget(uid: string | null) {
  const [budget, setBudget] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setBudget(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const userDoc = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDoc,
      (snap) => {
        const data = snap.data();
        setBudget(typeof data?.budget === 'number' ? data.budget : null);
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const updateBudget = useCallback(
    async (value: number) => {
      if (!uid || !db) return;
      await setDoc(doc(db, 'users', uid), { budget: value }, { merge: true });
    },
    [uid]
  );

  return { budget, loaded, updateBudget };
}
