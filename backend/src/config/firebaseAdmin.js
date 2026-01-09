import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin for Authentication AND Firestore
let serviceAccount;

try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        serviceAccount = {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL
        };
    }
} catch (error) {
    console.warn('Firebase credentials not found in environment variables');
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized (Auth + Firestore)');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log('✅ Firebase Admin initialized with application default credentials');
    } else {
        console.warn('⚠️ Firebase Admin not initialized - no credentials found');
        console.warn('Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL environment variables');
    }
}

// Export auth and Firestore services
export const auth = admin.auth();
export const db = admin.firestore();

export default admin;
