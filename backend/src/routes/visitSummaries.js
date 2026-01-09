import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { db } from '../config/firebaseAdmin.js';

const router = express.Router();

// GET /visit-summaries/list - Get all visit summaries
router.get('/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const snapshot = await db.collection('visitSummaries')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const summaries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                documentId: data.documentId,
                doctorSummary: data.doctorSummary,
                patientSummary: data.patientSummary,
                medications: data.medications,
                followUps: data.followUps,
                redFlags: data.redFlags,
                createdAt: data.createdAt
            };
        });

        res.json({ summaries });
    } catch (error) {
        console.error('Error fetching visit summaries:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
});

// GET /visit-summaries/latest - Get latest visit summary
router.get('/latest', verifyToken, async (req, res) => {
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
        console.error('Error fetching latest summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// GET /visit-summaries/:id - Get specific visit summary
router.get('/:id', verifyToken, async (req, res) => {
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
                medications: data.medications,
                followUps: data.followUps,
                redFlags: data.redFlags,
                createdAt: data.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

export default router;
