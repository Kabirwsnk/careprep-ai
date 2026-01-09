import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").trim()
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase env vars missing:");
    console.error("FIREBASE_PROJECT_ID:", !!projectId);
    console.error("FIREBASE_CLIENT_EMAIL:", !!clientEmail);
    console.error("FIREBASE_PRIVATE_KEY:", !!privateKey);
    throw new Error("Firebase credentials not configured.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("✅ Firebase Admin initialized");
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
export default admin;