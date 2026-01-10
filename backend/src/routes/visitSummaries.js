import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { db, isFirebaseReady } from '../config/firebaseAdmin.js';

const router = express.Router();

// Middleware to check if Firebase is ready
const checkFirebase = (req, res, next) => {
    if (!isFirebaseReady() || !db) {
        console.error('❌ Firebase not initialized - cannot process visit summaries request');
        return res.status(503).json({
            error: 'Database service unavailable',
            details: 'Firebase is not properly initialized. Please check server configuration.'
        });
    }
    next();
};

// GET /visit-summaries/list - Get all visit summaries
router.get('/list', verifyToken, checkFirebase, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Simple query without orderBy to avoid composite index requirement
        const snapshot = await db.collection('visitSummaries')
            .where('userId', '==', userId)
            .limit(50)
            .get();

        const summaries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                documentId: data.documentId,
                doctorSummary: data.doctorSummary,
                patientSummary: data.patientSummary,
                medications: data.medications || [],
                followUps: data.followUps || [],
                redFlags: data.redFlags || [],
                createdAt: data.createdAt
            };
        });

        // Sort client-side by createdAt descending
        summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ summaries });
    } catch (error) {
        console.error('Error fetching visit summaries:', error.message);
        res.status(500).json({ error: 'Failed to fetch summaries', details: error.message });
    }
});

// GET /visit-summaries/latest - Get latest visit summary
router.get('/latest', verifyToken, checkFirebase, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Simple query without orderBy to avoid composite index requirement
        const snapshot = await db.collection('visitSummaries')
            .where('userId', '==', userId)
            .limit(10)
            .get();

        if (snapshot.empty) {
            return res.json({ summary: null });
        }

        // Sort client-side and get the latest
        const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const data = docs[0];

        res.json({
            summary: {
                id: data.id,
                documentId: data.documentId,
                doctorSummary: data.doctorSummary,
                patientSummary: data.patientSummary,
                medications: data.medications || [],
                followUps: data.followUps || [],
                redFlags: data.redFlags || [],
                createdAt: data.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching latest summary:', error.message);
        res.status(500).json({ error: 'Failed to fetch summary', details: error.message });
    }
});

// GET /visit-summaries/:id - Get specific visit summary
router.get('/:id', verifyToken, checkFirebase, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const docRef = db.collection('visitSummaries').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Summary not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({
            summary: {
                id: doc.id,
                documentId: data.documentId,
                doctorSummary: data.doctorSummary,
                patientSummary: data.patientSummary,
                medications: data.medications || [],
                followUps: data.followUps || [],
                redFlags: data.redFlags || [],
                createdAt: data.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error.message);
        res.status(500).json({ error: 'Failed to fetch summary', details: error.message });
    }
});

export default router;

