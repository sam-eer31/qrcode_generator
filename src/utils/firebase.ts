import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const getFirebaseConfig = (): FirebaseConfig | null => {
  // 1. Check environment variables
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  };

  if (envConfig.apiKey) {
    return envConfig;
  }

  // 2. Check localStorage custom config
  try {
    const localConfigStr = localStorage.getItem('qr-studio-firebase-config');
    if (localConfigStr) {
      const parsed = JSON.parse(localConfigStr);
      if (parsed && parsed.apiKey) {
        return parsed as FirebaseConfig;
      }
    }
  } catch (e) {
    console.error('Error parsing local Firebase config:', e);
  }

  return null;
};

const config = getFirebaseConfig();

export const isFirebaseConfigured = (): boolean => {
  return !!config;
};

// Services initialized dynamic exports
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

if (config) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
  } catch (error) {
    console.error('Error initializing Firebase services:', error);
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
