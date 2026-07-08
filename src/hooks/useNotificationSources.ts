import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase';
import { PRESET_NOTIFICATION_SOURCES } from '../notificationFilter';
import { NotificationSource } from '../types';

export function useNotificationSources(uid: string | null) {
  const [sources, setSources] = useState<NotificationSource[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setSources([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const firestore = db;
    const userRef = doc(firestore, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (snap) => {
        const data = snap.data();
        if (!data?.notificationSourcesInitialized) {
          // Seed once per account, every preset starting disabled — approving a source is always
          // an explicit, separate action from just having the app installed.
          const seeded: NotificationSource[] = PRESET_NOTIFICATION_SOURCES.map((preset, index) => ({
            id: `preset-${index}`,
            packageName: preset.packageName,
            label: preset.label,
            enabled: false,
            isPreset: true,
          }));
          await setDoc(
            userRef,
            { notificationSources: seeded, notificationSourcesInitialized: true },
            { merge: true }
          );
          return; // the write above re-triggers this snapshot listener
        }
        setSources(Array.isArray(data.notificationSources) ? data.notificationSources : []);
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const persist = useCallback(
    async (next: NotificationSource[]) => {
      if (!uid || !db) return;
      await setDoc(doc(db, 'users', uid), { notificationSources: next }, { merge: true });
    },
    [uid]
  );

  const toggleSource = useCallback(
    (id: string, enabled: boolean) => persist(sources.map((s) => (s.id === id ? { ...s, enabled } : s))),
    [sources, persist]
  );

  const addSource = useCallback(
    (packageName: string, label: string) =>
      persist([
        ...sources,
        { id: `custom-${Date.now()}`, packageName, label, enabled: false, isPreset: false },
      ]),
    [sources, persist]
  );

  const removeSource = useCallback((id: string) => persist(sources.filter((s) => s.id !== id)), [sources, persist]);

  return { sources, loaded, toggleSource, addSource, removeSource };
}
