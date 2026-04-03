import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, initializeFirebaseClient } from '@/firebase/client';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Initialize Firebase synchronously (no API call needed)
    const { auth: initializedAuth } = initializeFirebaseClient();

    setFirebaseReady(true);

    if (!initializedAuth) {
      console.warn('Firebase auth not available');
      setLoading(false);
      setAuthInitialized(true);
      return;
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(initializedAuth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    authInitialized,
    firebaseReady,
    auth
  };
};
