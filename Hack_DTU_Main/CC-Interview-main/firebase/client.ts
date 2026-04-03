// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase config from environment variables (no API call needed)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initialized = false;

// Initialize Firebase synchronously (no async/await needed)
const initializeFirebaseClient = () => {
  if (typeof window === 'undefined') {
    return { auth: null, db: null };
  }

  if (initialized) {
    return { auth, db };
  }

  // Check if config is valid
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase client: No valid configuration available');
    return { auth: null, db: null };
  }

  try {
    // Initialize Firebase if not already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    initialized = true;

    return { auth, db };
  } catch (error) {
    console.error('Firebase client initialization error:', error);
    return { auth: null, db: null };
  }
};

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  const result = initializeFirebaseClient();
  auth = result.auth;
  db = result.db;
}

export { auth, db, initializeFirebaseClient };
