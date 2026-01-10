import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let firebaseInitialized = false;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle both raw newlines and escaped newlines (\n)
    privateKey = privateKey.replace(/\\n/g, '\n');
    // Ensure the key has proper header and footer
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.warn("⚠️ FIREBASE_PRIVATE_KEY missing standard header");
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase environment variables missing or incomplete:");
    console.log("FIREBASE_PROJECT_ID:", projectId ? "✅ Set" : "❌ Missing");
    console.log("FIREBASE_CLIENT_EMAIL:", clientEmail ? "✅ Set" : "❌ Missing");
    console.log("FIREBASE_PRIVATE_KEY:", privateKey ? "✅ Set" : "❌ Missing");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firebaseInitialized = true;
      console.log("✅ Firebase Admin initialized successfully");
    } catch (initError) {
      console.error("❌ Firebase Admin initialization failed:", initError.message);
    }
  }
} else {
  firebaseInitialized = true;
}

// Helper function to check if Firebase is ready
export function isFirebaseReady() {
  return firebaseInitialized && admin.apps.length > 0;
}

// Only create auth and db if Firebase is initialized
let auth = null;
let db = null;

if (isFirebaseReady()) {
  auth = admin.auth();
  db = admin.firestore();
} else {
  console.error("❌ Firebase not initialized - auth and db will be null");
}

export { auth, db };
export default admin;