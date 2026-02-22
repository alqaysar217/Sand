
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const apps = getApps();
  let app: FirebaseApp;
  
  if (!apps.length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Initialize Firestore with settings to handle potential proxy/connectivity issues in cloud environments
  const firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Fixes connection issues in some cloud IDE environments
  });

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
