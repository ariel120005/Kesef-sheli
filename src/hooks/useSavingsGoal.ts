import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';

export function useSavingsGoal(uid: string | null) {
  const [savingsGoal, setSavingsGoal] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setSavingsGoal(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const userDoc = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDoc,
      (snap) => {
        const data = snap.data();
        setSavingsGoal(typeof data?.savingsGoal === 'number' ? data.savingsGoal : null);
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const updateSavingsGoal = useCallback(
    async (value: number) => {
      if (!uid || !db) return;
      await setDoc(doc(db, 'users', uid), { savingsGoal: value }, { merge: true });
    },
    [uid]
  );

  return { savingsGoal, loaded, updateSavingsGoal };
}
