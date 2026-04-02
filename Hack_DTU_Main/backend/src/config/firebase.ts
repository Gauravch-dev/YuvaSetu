import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Helper to handle both file path and base64 encoded JSON
const getServiceAccountKey = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            // If it's a JSON string (starts with {)
            if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim().startsWith('{')) {
                return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            }
            // Otherwise treat as a path (require handles JSON files)
            return require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
            return undefined;
        }
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return undefined; // Let default credential provider handle it
    }

    console.warn('Warning: No Firebase credentials provided (FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS missing)');
    return undefined;
};

const serviceAccount = getServiceAccountKey();

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

export const firebaseAuth = admin.auth();
