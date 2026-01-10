import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { db, isFirebaseReady } from '../config/firebaseAdmin.js';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// Middleware to check if Firebase is ready
const checkFirebase = (req, res, next) => {
    if (!isFirebaseReady() || !db) {
        console.error('❌ Firebase not initialized - cannot process symptoms request');
        return res.status(503).json({
            error: 'Database service unavailable',
            details: 'Firebase is not properly initialized. Please check server configuration.'
        });
    }
    next();
};

// POST /symptoms/add - Add a new symptom
router.post('/add', verifyToken, checkFirebase, async (req, res) => {
    try {
        console.log('Symptoms add request body:', JSON.stringify(req.body));

        const { symptom, severity, notes, date } = req.body;
        const userId = req.user.uid;

        if (!symptom || symptom.trim() === '') {
            return res.status(400).json({ error: 'Symptom name is required' });
        }

        if (severity === undefined || severity === null) {
            return res.status(400).json({ error: 'Severity is required' });
        }

        const severityNum = parseInt(severity);
        if (isNaN(severityNum) || severityNum < 1 || severityNum > 10) {
            return res.status(400).json({ error: 'Severity must be a number between 1 and 10' });
        }

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const symptomData = {
            userId,
            symptom: symptom.trim(),
            severity: severityNum,
            notes: notes?.trim() || '',
            date,
            createdAt: new Date().toISOString()
        };

        console.log('Saving symptom data:', JSON.stringify(symptomData));

        const docRef = await db.collection('symptoms').add(symptomData);

        console.log('Symptom saved successfully with ID:', docRef.id);

        res.status(201).json({
            success: true,
            id: docRef.id,
            symptom: { id: docRef.id, ...symptomData }
        });
    } catch (error) {
        console.error('Error adding symptom:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to add symptom', details: error.message });
    }
});

// GET /symptoms/list - Get user's symptoms
router.get('/list', verifyToken, checkFirebase, async (req, res) => {
    try {
        const userId = req.user.uid;
        const limit = parseInt(req.query.limit) || 100;

        console.log(`Fetching symptoms for user: ${userId}`);

        // Simple query without orderBy to avoid composite index requirement
        const snapshot = await db.collection('symptoms')
            .where('userId', '==', userId)
            .limit(limit)
            .get();

        console.log(`Found ${snapshot.docs.length} symptoms`);

        const symptoms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort client-side by date
        symptoms.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ symptoms });
    } catch (error) {
        console.error('Error fetching symptoms:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch symptoms', details: error.message });
    }
});

// DELETE /symptoms/:id - Delete a symptom
router.delete('/:id', verifyToken, checkFirebase, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const docRef = db.collection('symptoms').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Symptom not found' });
        }

        if (doc.data().userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this symptom' });
        }

        await docRef.delete();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting symptom:', error);
        res.status(500).json({ error: 'Failed to delete symptom' });
    }
});

// POST /symptoms/summary - Generate AI summary of symptoms
router.post('/summary', verifyToken, checkFirebase, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Simple query without orderBy to avoid composite index requirement
        const snapshot = await db.collection('symptoms')
            .where('userId', '==', userId)
            .limit(30)
            .get();

        const symptoms = snapshot.docs.map(doc => doc.data());

        // Sort client-side by date (descending - most recent first)
        symptoms.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (symptoms.length === 0) {
            return res.status(400).json({ error: 'No symptoms to summarize' });
        }

        // Call AI service to generate summary
        try {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/summarize/symptoms`, {
                symptoms: symptoms
            }, { timeout: 30000 });

            res.json({
                success: true,
                summary: aiResponse.data.summary
            });
        } catch (aiError) {
            console.warn('AI service unavailable for symptom summary:', aiError.message);

            // Fallback summary when AI service is unavailable
            const symptomList = symptoms.slice(0, 10).map(s =>
                `• ${s.date}: ${s.symptom} (Severity: ${s.severity}/10)${s.notes ? ` - ${s.notes}` : ''}`
            ).join('\n');

            const fallbackSummary = `**Symptom Summary for Your Doctor**

You have logged ${symptoms.length} symptom(s). Here's a summary to share with your healthcare provider:

${symptomList}

**Next Steps:**
• Discuss these symptoms with your doctor
• Mention any patterns you've noticed
• Ask about possible causes and treatments

⚠️ DISCLAIMER: This summary is for informational purposes only. Always consult your healthcare provider for medical advice.`;

            res.json({
                success: true,
                summary: fallbackSummary
            });
        }
    } catch (error) {
        console.error('Error generating symptom summary:', error.message);
        res.status(500).json({ error: 'Failed to generate summary', details: error.message });
    }
});

export default router;
