import admin from "../config/firebaseAdmin.js";

export async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization token" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("❌ Token verification failed:", error.message);
        if (error.code === 'auth/id-token-expired') {
            console.warn("Token expired for request to:", req.path);
        }
        return res.status(401).json({
            error: "Unauthorized: Invalid token",
            details: error.message
        });
    }
}