import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';
import { Currency } from '../types';

export function useAppSettings(uid: string | null) {
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | 'ILS'>('ILS');
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setDefaultCurrency('ILS');
      setMonthStartDay(1);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const userDoc = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDoc,
      (snap) => {
        const data = snap.data();
        setDefaultCurrency(
          typeof data?.defaultCurrency === 'string' ? (data.defaultCurrency as Currency | 'ILS') : 'ILS'
        );
        setMonthStartDay(typeof data?.monthStartDay === 'number' ? data.monthStartDay : 1);
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const updateDefaultCurrency = useCallback(
    async (value: Currency | 'ILS') => {
      if (!uid || !db) return;
      await setDoc(doc(db, 'users', uid), { defaultCurrency: value }, { merge: true });
    },
    [uid]
  );

  const updateMonthStartDay = useCallback(
    async (value: number) => {
      if (!uid || !db) return;
      await setDoc(doc(db, 'users', uid), { monthStartDay: value }, { merge: true });
    },
    [uid]
  );

  return { defaultCurrency, monthStartDay, loaded, updateDefaultCurrency, updateMonthStartDay };
}
