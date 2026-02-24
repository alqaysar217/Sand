
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
  createEmployeeAccount: (data: { name: string, username: string, dept: Department, password: string, role: UserRole, allowedDepts: Department[] }) => Promise<void>;
  updateEmployeeProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  currentSessionDept: Department | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        
        // التحقق من صلاحيات المدير العام الأساسي (وصول مطلق)
        if (userData.username === 'BIM0100') {
          setCurrentSessionDept(targetDept);
          return;
        }

        // التحقق من صلاحيات المدراء (وصول للأقسام المسموحة فقط)
        if (userData.role === 'Admin') {
          const isAllowed = userData.allowedDepartments?.includes(targetDept) || targetDept === 'Operations';
          if (!isAllowed) {
            await signOut(auth);
            throw new Error(`عذراً، هويتك الإدارية غير مخولة لدخول قسم (${targetDept}).`);
          }
          setCurrentSessionDept(targetDept);
          return;
        }

        // التحقق للموظفين (قسم واحد فقط)
        if (userData.department !== targetDept) {
          await signOut(auth);
          throw new Error(`عذراً، هويتك المصرفية مرتبطة بقسم (${userData.department}) فقط.`);
        }
        setCurrentSessionDept(targetDept);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
      throw err;
    }
  };

  const createEmployeeAccount = async (data: { name: string, username: string, dept: Department, password: string, role: UserRole, allowedDepts: Department[] }) => {
    if (!db || !auth.currentUser) return;
    
    const exists = await checkUsernameExists(data.username);
    if (exists) {
      throw new Error('اسم المستخدم (BIM ID) مسجل مسبقاً لموظف آخر.');
    }

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
        department: data.dept,
        allowedDepartments: data.role === 'Admin' ? data.allowedDepts : [data.dept],
        password: data.password,
        createdAt: new Date().toISOString()
      });
      await signOut(secondaryAuth);
    } catch (err: any) {
      throw err;
    }
  };

  const updateEmployeeProfile = async (uid: string, data: Partial<UserProfile>) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().username === 'BIM0100') {
      // حماية المدير الأساسي من تغيير الصلاحيات أو القسم
      const { role, department, username, ...safeData } = data;
      await updateDoc(userRef, safeData);
      return;
    }

    if (data.password) {
      try {
        const oldDoc = await getDoc(userRef);
        if (oldDoc.exists()) {
          const oldData = oldDoc.data();
          if (data.password !== oldData.password) {
            const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
            const secondaryAuth = getAuth(secondaryApp);
            const userCred = await signInWithEmailAndPassword(secondaryAuth, oldData.email, oldData.password);
            await updatePassword(userCred.user, data.password);
            await signOut(secondaryAuth);
          }
        }
      } catch (authErr) {
        // تجاهل أخطاء المصادقة الخلفية في حال تم تغيير كلمة المرور سابقاً
      }
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
    if (!auth.currentUser) return;
    await updatePassword(auth.currentUser, newPassword);
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { password: newPassword });
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
