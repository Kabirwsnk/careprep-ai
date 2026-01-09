import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin for Authentication AND Firestore
let serviceAccount;
let isInitialized = false;

try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        console.log('🔑 Firebase credentials found in environment');
        serviceAccount = {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL
        };
    } else {
        console.error('❌ Missing Firebase credentials:');
        console.error('  FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
        console.error('  FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
        console.error('  FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
    }
} catch (error) {
    console.error('❌ Error reading Firebase credentials:', error.message);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    if (serviceAccount) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            isInitialized = true;
            console.log('✅ Firebase Admin initialized (Auth + Firestore)');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin:', error.message);
            throw error;
        }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
            isInitialized = true;
            console.log('✅ Firebase Admin initialized with application default credentials');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin with default credentials:', error.message);
            throw error;
        }
    } else {
        console.error('❌ Firebase Admin cannot be initialized - no credentials found');
        console.error('Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL environment variables');
        throw new Error('Firebase credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.');
    }
} else {
    isInitialized = true;
}

// Export auth and Firestore services only if initialized
if (!isInitialized) {
    throw new Error('Firebase Admin SDK not initialized');
}

export const auth = admin.auth();
export const db = admin.firestore();

export default admin;
