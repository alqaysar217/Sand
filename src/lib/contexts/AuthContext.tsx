
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Department } from '../types';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setupDemoProfile: (role: UserRole, dept: Department, name: string) => Promise<void>;
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
          setError("خطأ في جلب بيانات المستخدم.");
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
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (signUpErr) {
          throw err;
        }
      } else {
        throw err;
      }
    }
  };

  const setupDemoProfile = async (role: UserRole, dept: Department, name: string) => {
    if (!firebaseUser || !db) return;
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email,
        role: role,
        department: dept
      });
      setError(null);
    } catch (err) {
      console.error("Error setting up profile:", err);
      throw err;
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
      setupDemoProfile,
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
