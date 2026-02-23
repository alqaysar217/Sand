'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore'

/**
 * تهيئة خدمات فيربيس مع إعدادات تضمن استقرار الاتصال في البيئة السحابية.
 * نستخدم Long Polling لتجنب مشاكل انقطاع الـ WebSocket الشائعة في بيئات الحاويات.
 */
export function initializeFirebase() {
  const apps = getApps();
  const app = !apps.length ? initializeApp(firebaseConfig) : getApp();

  let firestore;
  try {
    // محاولة تهيئة Firestore مع إعدادات Long Polling الإجبارية
    firestore = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    });
  } catch (err) {
    // في حال تم تهيئة Firestore مسبقاً، نقوم بجلب المثيل الحالي
    firestore = getFirestore(app);
  }

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
