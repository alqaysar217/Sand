
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    if (firebaseUser && db) {
      setLoading(true);
      unsubscribe = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ ...docSnap.data() as UserProfile, id: firebaseUser.uid });
            setError(null);
          } else {
            setProfile(null);
            setError("MISSING_PROFILE");
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching profile:", err);
          setError("خطأ في جلب بيانات المستخدم من قاعدة البيانات.");
          setLoading(false);
        }
      );
    } else if (!isUserLoading) {
      setProfile(null);
      setLoading(false);
      setError(null);
    }

    return () => unsubscribe();
  }, [firebaseUser, isUserLoading, db]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user: profile,
      firebaseUser,
      login, 
      logout, 
      loading: loading || isUserLoading,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
