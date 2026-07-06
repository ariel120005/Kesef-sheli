import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isFirebaseConfigured } from '../firebase';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setInitializing(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase אינו מוגדר');
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase אינו מוגדר');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
