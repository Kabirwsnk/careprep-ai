import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

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
    // Don't throw here to allow health check to report the error
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    } catch (initError) {
      console.error("❌ Firebase Admin initialization failed:", initError.message);
    }
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
export default admin;