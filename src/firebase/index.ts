'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore'

// تهيئة خدمات فيربيس مع إعدادات تضمن استقرار الاتصال في البيئة السحابية
export function initializeFirebase() {
  const apps = getApps();
  let app: FirebaseApp;
  
  if (!apps.length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // استخدام Long Polling لتجنب مشاكل انقطاع الـ WebSocket في المتصفح السحابي
  const firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
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