
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/firebase';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (firebaseUser && db) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If no profile exists, we can't assume role. 
          // In a real app, this would be created during signup.
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    if (!isUserLoading) {
      fetchProfile();
    }
  }, [firebaseUser, isUserLoading, db]);

  const login = async (email: string) => {
    // For prototype purposes, we use a default password 'password123' 
    // since the user didn't specify password logic.
    try {
      await signInWithEmailAndPassword(auth, email, 'password123');
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user: profile, login, logout, loading: loading || isUserLoading }}>
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
