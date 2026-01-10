import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { db } from '../config/firebaseAdmin.js';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// POST /symptoms/add - Add a new symptom
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { symptom, severity, notes, date } = req.body;
        const userId = req.user.uid;

        if (!symptom || !severity || !date) {
            return res.status(400).json({ error: 'Symptom, severity, and date are required' });
        }

        if (severity < 1 || severity > 10) {
            return res.status(400).json({ error: 'Severity must be between 1 and 10' });
        }

        const symptomData = {
            userId,
            symptom: symptom.trim(),
            severity: parseInt(severity),
            notes: notes?.trim() || '',
            date,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('symptoms').add(symptomData);

        res.status(201).json({
            success: true,
            id: docRef.id,
            symptom: { id: docRef.id, ...symptomData }
        });
    } catch (error) {
        console.error('Error adding symptom:', error);
        res.status(500).json({ error: 'Failed to add symptom' });
    }
});

// GET /symptoms/list - Get user's symptoms
router.get('/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const limit = parseInt(req.query.limit) || 100;

        // Simple query without orderBy to avoid composite index requirement
        const snapshot = await db.collection('symptoms')
            .where('userId', '==', userId)
            .limit(limit)
            .get();

        const symptoms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort client-side by date
        symptoms.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ symptoms });
    } catch (error) {
        console.error('Error fetching symptoms:', error.message);
        res.status(500).json({ error: 'Failed to fetch symptoms', details: error.message });
    }
});

// DELETE /symptoms/:id - Delete a symptom
router.delete('/:id', verifyToken, async (req, res) => {
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
router.post('/summary', verifyToken, async (req, res) => {
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
