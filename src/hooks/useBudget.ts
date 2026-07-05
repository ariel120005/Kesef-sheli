import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export function useBudget() {
  const [budget, setBudget] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.budget)
      .then((raw) => {
        if (raw) setBudget(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const updateBudget = useCallback((value: number) => {
    setBudget(value);
    AsyncStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(value));
  }, []);

  return { budget, loaded, updateBudget };
}
