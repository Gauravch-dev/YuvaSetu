// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";

// // TODO: Replace with your actual Firebase config
// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_FAKE_KEY",
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project-id.firebaseapp.com",
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-id",
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project-id.appspot.com",
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
//     appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/*
Make sure these values exist in:
frontend/.env
*/

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();