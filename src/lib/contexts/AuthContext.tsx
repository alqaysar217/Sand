
"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Department } from '../types';
import { useUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { doc, onSnapshot, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword, getAuth, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any;
  login: (username: string, password: string, targetDept: Department) => Promise<void>;
  logout: () => Promise<void>;
  createEmployeeAccount: (data: { name: string, username: string, dept: Department, password: string, role: UserRole, allowedDepts: Department[] }) => Promise<void>;
  updateEmployeeProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  currentSessionDept: Department | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * وظيفة مساعدة لتحويل أخطاء Firebase التقنية إلى رسائل عربية مفهومة.
 */
function translateAuthError(error: any): string {
  switch (error.code) {
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً؛ يجب أن تتكون من 6 أحرف أو أرقام على الأقل لضمان أمن الحساب.';
    case 'auth/requires-recent-login':
      return 'انتهت صلاحية الجلسة الأمنية؛ يرجى تسجيل الخروج والدخول مرة أخرى لتغيير كلمة المرور.';
    case 'auth/network-request-failed':
      return 'فشل الاتصال بخادم الحماية؛ يرجى التحقق من استقرار الإنترنت لديك.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'بيانات الدخول (BIM ID أو كلمة المرور) غير صحيحة.';
    case 'auth/email-already-in-use':
      return 'اسم المستخدم (BIM ID) هذا مرتبط بحساب نشط بالفعل.';
    default:
      return error.message || 'حدث خطأ غير متوقع في نظام المصادقة.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionDept, setCurrentSessionDept] = useState<Department | null>(null);
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
            const data = docSnap.data() as UserProfile;
            setProfile({ ...data, id: firebaseUser.uid });
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
        
        if (userData.username === 'BIM0100') {
          setCurrentSessionDept(targetDept);
          return;
        }

        if (userData.role === 'Admin') {
          const isAllowed = userData.allowedDepartments?.includes(targetDept) || targetDept === 'Operations';
          if (!isAllowed) {
            await signOut(auth);
            throw new Error(`عذراً، هويتك الإدارية غير مخولة لدخول قسم (${targetDept}).`);
          }
          setCurrentSessionDept(targetDept);
          return;
        }

        if (userData.department !== targetDept) {
          await signOut(auth);
          throw new Error(`عذراً، هويتك المصرفية مرتبطة بقسم (${userData.department}) فقط.`);
        }
        setCurrentSessionDept(targetDept);
      }
    } catch (err: any) {
      throw new Error(translateAuthError(err));
    }
  };

  const createEmployeeAccount = async (data: { name: string, username: string, dept: Department, password: string, role: UserRole, allowedDepts: Department[] }) => {
    if (!db || !auth.currentUser) return;
    
    const exists = await checkUsernameExists(data.username);
    if (exists) {
      throw new Error('اسم المستخدم (BIM ID) مسجل مسبقاً لموظف آخر.');
    }

    const appName = `CreateApp_${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, appName);
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
        department: data.dept,
        allowedDepartments: data.role === 'Admin' ? data.allowedDepts : [data.dept],
        password: data.password,
        createdAt: new Date().toISOString()
      });
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
    } catch (err: any) {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (e) {}
      }
      throw new Error(translateAuthError(err));
    }
  };

  const updateEmployeeProfile = async (uid: string, data: Partial<UserProfile>) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    const isSelfUpdate = auth.currentUser && uid === auth.currentUser.uid;
    
    const oldDoc = await getDoc(userRef);
    if (!oldDoc.exists()) throw new Error("المستخدم غير موجود");
    const oldData = oldDoc.data() as UserProfile;

    if (data.password && data.password !== oldData.password) {
      if (isSelfUpdate && auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, data.password);
        } catch (e: any) {
          if (e.code === 'auth/requires-recent-login') {
            const credential = EmailAuthProvider.credential(oldData.email, oldData.password!);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, data.password);
          } else {
            throw new Error(translateAuthError(e));
          }
        }
      } else {
        const appName = `UpdateApp_${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        
        try {
          const userCred = await signInWithEmailAndPassword(secondaryAuth, oldData.email, oldData.password!);
          await updatePassword(userCred.user, data.password);
          await signOut(secondaryAuth);
          await deleteApp(secondaryApp);
        } catch (authErr: any) {
          if (secondaryApp) {
            try { await deleteApp(secondaryApp); } catch (e) {}
          }
          throw new Error(`فشل تحديث كلمة المرور في نظام الحماية: ${translateAuthError(authErr)}`);
        }
      }
    }
    
    if (oldData.username === 'BIM0100') {
      const { role, department, username, allowedDepartments, ...safeData } = data;
      await updateDoc(userRef, safeData);
      return;
    }

    await updateDoc(userRef, data);
  };

  const checkUsernameExists = async (username: string) => {
    if (!db) return false;
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setProfile(null);
    setCurrentSessionDept(null);
    setLoading(false);
  };

  const updateAdminPassword = async (newPassword: string) => {
    if (!auth.currentUser || !profile) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { password: newPassword });
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
         const credential = EmailAuthProvider.credential(profile.email, profile.password!);
         await reauthenticateWithCredential(auth.currentUser, credential);
         await updatePassword(auth.currentUser, newPassword);
         await updateDoc(doc(db, 'users', auth.currentUser.uid), { password: newPassword });
      } else {
         throw new Error(translateAuthError(e));
      }
    }
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
      error,
      currentSessionDept
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
