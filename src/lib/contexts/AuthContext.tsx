
"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Department } from '../types';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, onSnapshot, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any;
  login: (username: string, password: string, targetDept: Department) => Promise<void>;
  logout: () => Promise<void>;
  createEmployeeAccount: (data: { name: string, username: string, dept: Department, password: string }) => Promise<void>;
  updateEmployeeProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
  checkUsernameExists: (username: string) => Promise<boolean>;
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

  const login = async (username: string, password: string, targetDept: Department) => {
    const email = `${username.toLowerCase()}@sanad.bank`;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.department !== targetDept && userData.role !== 'Admin') {
          await signOut(auth);
          throw new Error(`عذراً، هويتك مرتبطة بـ (${userData.department}) وغير مخول لك دخول قسم (${targetDept}).`);
        }
      }
    } catch (err: any) {
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
            department: 'Operations',
            password: password
          });
          return;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
             throw new Error('كلمة المرور غير صحيحة لحساب المدير العام.');
          }
          throw err;
        }
      }
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
      throw err;
    }
  };

  const checkUsernameExists = async (username: string) => {
    if (!db) return false;
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const createEmployeeAccount = async (data: { name: string, username: string, dept: Department, password: string }) => {
    if (!db || !auth.currentUser) return;
    
    const exists = await checkUsernameExists(data.username);
    if (exists) {
      throw new Error('اسم المستخدم هذا محجوز بالفعل لموظف آخر.');
    }

    const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
    const secondaryAuth = getAuth(secondaryApp);
    const email = `${data.username.toLowerCase()}@sanad.bank`;
    const role: UserRole = data.dept === 'Support' ? 'Agent' : 'Specialist';
    
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, data.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid,
        username: data.username,
        name: data.name,
        email: email,
        role: role,
        department: data.dept,
        password: data.password,
        createdAt: new Date().toISOString()
      });
      await signOut(secondaryAuth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('اسم المستخدم (BIM ID) مسجل مسبقاً في نظام فيربيس.');
      }
      throw err;
    }
  };

  const updateEmployeeProfile = async (uid: string, data: Partial<UserProfile>) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);

    // إذا كان هناك تحديث لكلمة المرور، نحتاج لتحديثها في Auth أيضاً
    if (data.password) {
      try {
        const oldDoc = await getDoc(userRef);
        if (oldDoc.exists()) {
          const oldData = oldDoc.data();
          const email = oldData.email;
          const oldPassword = oldData.password;

          // استخدام تطبيق ثانوي لتحديث كلمة المرور دون التأثير على جلسة المدير الحالية
          const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
          const secondaryAuth = getAuth(secondaryApp);
          
          // 1. تسجيل الدخول بالبيانات القديمة
          const userCred = await signInWithEmailAndPassword(secondaryAuth, email, oldPassword);
          // 2. تحديث كلمة المرور
          await updatePassword(userCred.user, data.password);
          // 3. تسجيل الخروج من التطبيق الثانوي
          await signOut(secondaryAuth);
        }
      } catch (authErr: any) {
        console.error("Auth update failed:", authErr);
        throw new Error("فشل تحديث كلمة المرور في نظام الهوية: " + (authErr.message || "خطأ غير معروف"));
      }
    }
    
    if (data.department) {
      data.role = data.department === 'Support' ? 'Agent' : 'Specialist';
    }

    try {
      await updateDoc(userRef, data);
    } catch (err) {
      throw err;
    }
  };

  const updateAdminPassword = async (newPassword: string) => {
    if (!auth.currentUser) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { password: newPassword });
    } catch (err) {
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
      updateEmployeeProfile,
      updateAdminPassword,
      checkUsernameExists,
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
