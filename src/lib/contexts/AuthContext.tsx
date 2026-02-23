
"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  bypassLogin: (profile: UserProfile) => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mockUser, setMockUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapshotUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
      return;
    }

    // إذا تم تفعيل وضع العبور المباشر
    if (mockUser) {
      setProfile(mockUser);
      setLoading(false);
      return;
    }

    if (firebaseUser && db) {
      setLoading(true);
      
      if (snapshotUnsubscribe.current) {
        snapshotUnsubscribe.current();
      }

      snapshotUnsubscribe.current = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ ...docSnap.data() as UserProfile, id: firebaseUser.uid });
            setError(null);
          } else {
            setProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Firestore sync error:", err);
          setLoading(false);
        }
      );
    } else {
      setProfile(null);
      setLoading(false);
    }

    return () => {
      if (snapshotUnsubscribe.current) {
        snapshotUnsubscribe.current();
      }
    };
  }, [firebaseUser, isUserLoading, db, mockUser]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // محاولة إنشاء الحساب إذا لم يكن موجوداً
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (signUpErr: any) {
          throw err;
        }
      } else {
        throw err;
      }
    }
  };

  const setupDemoProfile = async (role: UserRole, dept: Department, name: string) => {
    if (mockUser) return; // لا حاجة للتحديث في وضع العبور
    if (!auth.currentUser || !db) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        id: auth.currentUser.uid,
        name: name,
        email: auth.currentUser.email,
        role: role,
        department: dept
      }, { merge: true });
    } catch (err) {
      console.error("Setup profile error:", err);
    }
  };

  const bypassLogin = (profile: UserProfile) => {
    setMockUser(profile);
  };

  const logout = async () => {
    setLoading(true);
    if (mockUser) {
      setMockUser(null);
    } else {
      await signOut(auth);
    }
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user: profile,
      firebaseUser,
      login, 
      logout,
      setupDemoProfile,
      bypassLogin,
      loading,
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
