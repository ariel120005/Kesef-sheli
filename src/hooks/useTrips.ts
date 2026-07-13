import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { MAX_TRIP_PARTICIPANTS } from '../constants';
import { generateJoinCode } from '../debtSimplification';
import { db } from '../firebase';
import { Trip } from '../types';

// Personal (unshared) trips live under users/{uid}/trips, same as before. Once a trip is turned
// shared it moves to a top-level sharedTrips/{tripId} collection instead — the only way another
// account can ever see it, since Firestore has no cross-account query into someone else's
// subcollections. `trips` below is the merge of both, so the rest of the app can keep treating
// "my trips" as one flat list regardless of which collection each one actually lives in.
export function useTrips(uid: string | null) {
  const [personalTrips, setPersonalTrips] = useState<Trip[]>([]);
  const [personalLoaded, setPersonalLoaded] = useState(false);
  const [sharedTrips, setSharedTrips] = useState<Trip[]>([]);
  const [sharedLoaded, setSharedLoaded] = useState(false);

  useEffect(() => {
    if (!uid || !db) {
      setPersonalTrips([]);
      setPersonalLoaded(true);
      return;
    }
    setPersonalLoaded(false);
    const tripsQuery = query(collection(db, 'users', uid, 'trips'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        setPersonalTrips(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Trip, 'id'>),
          }))
        );
        setPersonalLoaded(true);
      },
      () => setPersonalLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    if (!uid || !db) {
      setSharedTrips([]);
      setSharedLoaded(true);
      return;
    }
    setSharedLoaded(false);
    const sharedQuery = query(collection(db, 'sharedTrips'), where('participantUids', 'array-contains', uid));
    const unsubscribe = onSnapshot(
      sharedQuery,
      (snapshot) => {
        setSharedTrips(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Trip, 'id'>),
          }))
        );
        setSharedLoaded(true);
      },
      () => setSharedLoaded(true)
    );
    return unsubscribe;
  }, [uid]);

  const trips = [...personalTrips, ...sharedTrips].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const loaded = personalLoaded && sharedLoaded;

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
    async (trip: Trip) => {
      if (!uid || !db) return;
      const tripRef = trip.isShared ? doc(db, 'sharedTrips', trip.id) : doc(db, 'users', uid, 'trips', trip.id);
      // Firestore doesn't cascade-delete subcollections, so clear the trip's transactions first.
      const transactionsSnapshot = await getDocs(collection(tripRef, 'transactions'));
      const batch = writeBatch(db);
      transactionsSnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      await deleteDoc(tripRef);
    },
    [uid]
  );

  const endTrip = useCallback(
    async (trip: Trip) => {
      if (!uid || !db) return;
      const ref = trip.isShared ? doc(db, 'sharedTrips', trip.id) : doc(db, 'users', uid, 'trips', trip.id);
      await updateDoc(ref, { endedAt: new Date().toISOString() });
    },
    [uid]
  );

  // Migrates a personal trip (and all its transactions) into the top-level sharedTrips
  // collection, generating a unique 6-digit join code. From this point on the trip is only
  // reachable via sharedTrips — the users/{uid}/trips copy is deleted.
  const makeTripShared = useCallback(
    async (trip: Trip, displayName: string) => {
      if (!uid || !db) return { success: false, message: 'שגיאה' };
      const firestore = db;
      let code = generateJoinCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await getDocs(query(collection(firestore, 'sharedTrips'), where('joinCode', '==', code)));
        if (existing.empty) break;
        code = generateJoinCode();
      }
      const txSnapshot = await getDocs(collection(firestore, 'users', uid, 'trips', trip.id, 'transactions'));
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'sharedTrips', trip.id), {
        name: trip.name,
        budget: trip.budget,
        createdAt: trip.createdAt,
        endedAt: trip.endedAt ?? null,
        isShared: true,
        joinCode: code,
        ownerUid: uid,
        participants: [{ uid, displayName, joinedAt: new Date().toISOString() }],
        participantUids: [uid],
      });
      txSnapshot.docs.forEach((docSnap) => {
        batch.set(doc(firestore, 'sharedTrips', trip.id, 'transactions', docSnap.id), docSnap.data());
        batch.delete(docSnap.ref);
      });
      batch.delete(doc(firestore, 'users', uid, 'trips', trip.id));
      await batch.commit();
      return { success: true, message: 'הטיול הפך למשותף' };
    },
    [uid]
  );

  const joinTripByCode = useCallback(
    async (code: string, displayName: string) => {
      if (!uid || !db) return { success: false, message: 'שגיאה' };
      const snapshot = await getDocs(query(collection(db, 'sharedTrips'), where('joinCode', '==', code.trim())));
      if (snapshot.empty) return { success: false, message: 'קוד לא נמצא — בדקו ונסו שוב' };
      const tripDoc = snapshot.docs[0];
      const data = tripDoc.data() as Omit<Trip, 'id'>;
      const participants = data.participants ?? [];
      if (participants.some((p) => p.uid === uid)) {
        return { success: false, message: 'כבר הצטרפת לטיול הזה' };
      }
      if (participants.length >= MAX_TRIP_PARTICIPANTS) {
        return { success: false, message: `הטיול הגיע למספר המשתתפים המרבי (${MAX_TRIP_PARTICIPANTS})` };
      }
      await updateDoc(tripDoc.ref, {
        participants: arrayUnion({ uid, displayName, joinedAt: new Date().toISOString() }),
        participantUids: arrayUnion(uid),
      });
      return { success: true, message: `הצטרפת/ה לטיול "${data.name}"` };
    },
    [uid]
  );

  return { trips, loaded, addTrip, deleteTrip, endTrip, makeTripShared, joinTripByCode };
}
