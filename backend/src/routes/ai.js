import express from 'express';
import axios from 'axios';
import { verifyToken } from "../middleware/authMiddleware.js";
import { db } from '../config/firebaseAdmin.js';

async function callAI(payload, retries = 2) {
    try {
        return await axios.post(`${AI_SERVICE_URL}/chat`, payload, { timeout: 15000 });
    } catch (err) {
        if (err.response?.status === 429 && retries > 0) {
            console.warn("Rate limited. Retrying...");
            await new Promise(r => setTimeout(r, 5000));
            return callAI(payload, retries - 1);
        }
        throw err;
    }
}
import fs from 'fs';
import path from 'path';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// POST /ai/summarize - Process and summarize a document
router.post('/summarize', verifyToken, async (req, res) => {
    try {
        const { documentId } = req.body;
        const userId = req.user.uid;

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }

        // Get document from Firestore
        const docRef = db.collection('documents').doc(documentId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const docData = doc.data();
        if (docData.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Read file and convert to base64 for AI service
        let fileData = null;
        if (docData.filePath && fs.existsSync(docData.filePath)) {
            fileData = fs.readFileSync(docData.filePath, { encoding: 'base64' });
        }

        // Call AI service to process document
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/process`, {
            documentId,
            fileData,
            fileName: docData.fileName || 'document',
            userId
        }, { timeout: 60000 });

        const { processedText, doctorSummary, patientSummary, medications, followUps, redFlags } = aiResponse.data;

        // Update document with processed text
        await docRef.update({
            processedText,
            processedAt: new Date().toISOString()
        });

        // Create visit summary in Firestore
        const summaryData = {
            userId,
            documentId,
            doctorSummary,
            patientSummary,
            medications: medications || [],
            followUps: followUps || [],
            redFlags: redFlags || [],
            createdAt: new Date().toISOString()
        };

        const summaryRef = await db.collection('visitSummaries').add(summaryData);

        res.json({
            success: true,
            summaryId: summaryRef.id,
            summary: {
                doctorSummary,
                patientSummary,
                medications: medications || [],
                followUps: followUps || [],
                redFlags: redFlags || []
            }
        });
    } catch (error) {
        console.error('Error processing document:', error);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'AI service is unavailable. Please ensure the Python AI service is running.'
            });
        }

        res.status(500).json({ error: 'Failed to process document' });
    }
});

// POST /ai/chat - Chat with AI assistant
router.post("/chat", verifyToken, async (req, res) => {
    try {
        const { message, mode, context } = req.body;

        const response = await axios.post(
            "https://careprep-ai-service.onrender.com/chat", // Your AI service endpoint
            { message, mode, context }
        );

        res.json(response.data);
    } catch (err) {
        console.error("Chat error:", err.response?.data || err.message);

        if (err.response?.status === 429) {
            return res.status(429).json({
                error: "Too many requests. Please wait 1 minute and try again."
            });
        }

        res.status(500).json({ error: "Chat service failed" });
    }
});

// Example symptoms list route
router.get("/symptoms/list", verifyToken, async (req, res) => {
    try {
        // Replace this with your real DB call
        const symptoms = [
            "Fever",
            "Cough",
            "Headache",
            "Fatigue",
            "Sore throat",
            "Shortness of breath"
        ];

        res.json(symptoms);

    } catch (err) {
        console.error("Symptoms list error:", err.message, err.stack);
        res.status(500).json({ error: "Failed to fetch symptoms" });
    }
});

// GET /ai/summary - Get latest AI summary for user
router.get('/summary', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const snapshot = await db.collection('visitSummaries')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json({ summary: null });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        res.json({
            summary: {
                id: doc.id,
                documentId: data.documentId,
                doctorSummary: data.doctorSummary,
                patientSummary: data.patientSummary,
                medications: data.medications,
                followUps: data.followUps,
                redFlags: data.redFlags,
                createdAt: data.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching AI summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

export default router;
