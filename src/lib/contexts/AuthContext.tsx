
"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Department } from '../types';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createEmployeeAccount: (data: { name: string, username: string, role: UserRole, dept: Department, password: string }) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
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
  const snapshotUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
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
  }, [firebaseUser, isUserLoading, db]);

  const login = async (username: string, password: string) => {
    const email = `${username.toLowerCase()}@sanad.bank`;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // التعامل مع حالة المدير العام لأول مرة
      if (username === 'BIM0100' && password === 'ha892019' && 
         (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', cred.user.uid), {
            id: cred.user.uid,
            username: 'BIM0100',
            name: 'المدير العام',
            email: email,
            role: 'Admin',
            department: 'Operations'
          });
          return;
        } catch (createErr: any) {
          // إذا كان البريد مستخدم بالفعل، يعني أن كلمة السر خاطئة للمدير الموجود مسبقاً
          if (createErr.code === 'auth/email-already-in-use') {
             throw new Error('كلمة المرور غير صحيحة لحساب المدير العام.');
          }
          throw err;
        }
      }
      throw err;
    }
  };

  const createEmployeeAccount = async (data: { name: string, username: string, role: UserRole, dept: Department, password: string }) => {
    if (!db || !auth.currentUser) return;
    
    const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
    const secondaryAuth = getAuth(secondaryApp);
    
    const email = `${data.username.toLowerCase()}@sanad.bank`;
    
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, data.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid,
        username: data.username,
        name: data.name,
        email: email,
        role: data.role,
        department: data.dept
      });
      await signOut(secondaryAuth);
    } catch (err) {
      console.error("Create account error:", err);
      throw err;
    }
  };

  const updateAdminPassword = async (newPassword: string) => {
    if (!auth.currentUser) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (err) {
      console.error("Update password error:", err);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user: profile,
      firebaseUser,
      login, 
      logout,
      createEmployeeAccount,
      updateAdminPassword,
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
