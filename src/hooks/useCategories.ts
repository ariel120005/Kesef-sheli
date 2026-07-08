import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants';
import { db } from '../firebase';
import { CategoryDef } from '../types';

export function useCategories(uid: string | null) {
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setCategories([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const firestore = db;
    const categoriesRef = collection(firestore, 'users', uid, 'categories');
    const unsubscribe = onSnapshot(
      categoriesRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed a brand-new (or pre-existing, category-less) account with the default set once,
          // guarded by a flag on the user doc so deleting down to zero categories later doesn't
          // silently bring them back.
          const userRef = doc(firestore, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.data()?.categoriesInitialized) {
            const batch = writeBatch(firestore);
            for (const category of DEFAULT_CATEGORIES) {
              batch.set(doc(categoriesRef), { name: category.name, color: category.color });
            }
            batch.set(userRef, { categoriesInitialized: true }, { merge: true });
            await batch.commit();
            return; // the batch write re-triggers this snapshot listener
          }
        }
        setCategories(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<CategoryDef, 'id'>),
          }))
        );
        setLoaded(true);
      },
      () => setLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const addCategory = useCallback(
    async (name: string, color: string) => {
      if (!uid || !db) return;
      await addDoc(collection(db, 'users', uid, 'categories'), { name, color });
    },
    [uid]
  );

  const updateCategory = useCallback(
    async (id: string, name: string, color: string) => {
      if (!uid || !db) return;
      await updateDoc(doc(db, 'users', uid, 'categories', id), { name, color });
    },
    [uid]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!uid || !db) return;
      await deleteDoc(doc(db, 'users', uid, 'categories', id));
    },
    [uid]
  );

  return { categories, loaded, addCategory, updateCategory, deleteCategory };
}
