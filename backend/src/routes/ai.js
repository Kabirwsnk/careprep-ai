import express from 'express';
import axios from 'axios';
import { verifyToken } from "../middleware/authMiddleware.js";
import { db } from '../config/firebaseAdmin.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// OpenRouter fallback function for chat
async function chatWithOpenRouter(message, mode, context) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("OPENROUTER_API_KEY not set, cannot use fallback");
        return null;
    }

    // Build context-aware prompt
    let systemPrompt = "";
    if (mode === "pre_visit") {
        const symptoms = context?.symptoms || [];
        const symptomList = symptoms.length > 0
            ? symptoms.map(s => `- ${s.symptom} (severity: ${s.severity}/10, date: ${s.date})`).join("\n")
            : "No symptoms logged yet.";

        systemPrompt = `You are CarePrep AI, a helpful medical preparation assistant. You help patients prepare for doctor visits.

The patient has logged the following symptoms:
${symptomList}

Your role is to:
1. Help them understand their symptoms
2. Suggest questions to ask their doctor
3. Help them organize their health information
4. Provide general health information (not medical advice)

IMPORTANT: Always remind users that you are not a doctor and they should consult healthcare professionals for medical advice.`;
    } else {
        const summary = context?.summary || {};
        systemPrompt = `You are CarePrep AI, a helpful medical education assistant. You help patients understand their recent doctor visit.

${summary?.patientSummary ? `Visit Summary: ${summary.patientSummary}` : ""}
${summary?.medications?.length > 0 ? `Medications: ${JSON.stringify(summary.medications)}` : ""}
${summary?.followUps?.length > 0 ? `Follow-ups: ${JSON.stringify(summary.followUps)}` : ""}

Your role is to:
1. Explain medical terms in simple language
2. Help understand medication instructions
3. Clarify follow-up care requirements
4. Answer questions about the visit

IMPORTANT: Always remind users that you are not a doctor and they should consult healthcare professionals for medical advice.`;
    }

    try {
        const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "missing";
        console.log(`[OpenRouter Chat] Using key: ${maskedKey}, Model: ${process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free"}`);

        const response = await axios.post(
            OPENROUTER_API_URL,
            {
                model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 800
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://careprep-ai.local",
                    "X-Title": "CarePrep AI"
                },
                timeout: 30000
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            console.log("[OpenRouter Chat] Success: Received response");
            return response.data.choices[0].message.content;
        }

        console.warn("[OpenRouter Chat] unexpected response structure:", JSON.stringify(response.data));
        return null;
    } catch (error) {
        if (error.response) {
            console.error(`[OpenRouter Chat] API error (${error.response.status}):`, JSON.stringify(error.response.data));
        } else {
            console.error("[OpenRouter Chat] Network error:", error.message);
        }
        return null;
    }
}

// Call AI service with retry logic
async function callAIService(payload, retries = 2) {
    try {
        return await axios.post(`${AI_SERVICE_URL}/chat`, payload, { timeout: 15000 });
    } catch (err) {
        if (err.response?.status === 429 && retries > 0) {
            console.warn("Rate limited. Retrying in 5 seconds...");
            await new Promise(r => setTimeout(r, 5000));
            return callAIService(payload, retries - 1);
        }
        throw err;
    }
}

// OpenRouter document processing fallback
async function processDocumentWithOpenRouter(fileName, fileType) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("OPENROUTER_API_KEY not set for document processing");
        return null;
    }

    const prompt = `You are a medical document analyst. A patient has uploaded a medical document called "${fileName}" (type: ${fileType}).

Since I cannot read the actual content, please provide a helpful template response that the patient can fill in after reviewing their document.

Please provide:

**PATIENT-FRIENDLY SUMMARY**
Provide a template summary explaining common elements found in ${fileType.includes('pdf') ? 'medical PDFs' : 'medical documents'} and encourage the patient to review key sections.

**MEDICATIONS**
List common medication information to look for (dosage, timing, instructions).

**FOLLOW-UP ACTIONS**
Suggest common follow-up items patients should look for in medical documents.

**RED FLAGS**
List symptoms or warnings that typically appear in medical documents that require immediate attention.

Format your response clearly with these sections.`;

    try {
        const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "missing";
        console.log(`[OpenRouter Document] Using key: ${maskedKey}, Model: ${process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free"}`);

        const response = await axios.post(
            OPENROUTER_API_URL,
            {
                model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 1500
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://careprep-ai.local",
                    "X-Title": "CarePrep AI"
                },
                timeout: 45000
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            console.log("[OpenRouter Document] Success: Received response");
            const content = response.data.choices[0].message.content;
            return {
                processedText: `Document: ${fileName}\nType: ${fileType}\n\nThis document has been uploaded for your records.`,
                doctorSummary: `Uploaded document: ${fileName}`,
                patientSummary: content,
                medications: [
                    { name: "Review your document", dosage: "Check medication sections", timing: "As prescribed", notes: "Consult your doctor for specifics" }
                ],
                followUps: [
                    { action: "Review the uploaded document carefully", timing: "Today" },
                    { action: "Discuss contents with your healthcare provider", timing: "At next appointment" }
                ],
                redFlags: [
                    "Contact your doctor if you have questions about this document",
                    "Seek immediate care if document mentions urgent symptoms"
                ]
            };
        }

        console.warn("[OpenRouter Document] unexpected response structure:", JSON.stringify(response.data));
        return null;
    } catch (error) {
        if (error.response) {
            console.error(`[OpenRouter Document] API error (${error.response.status}):`, JSON.stringify(error.response.data));
        } else {
            console.error("[OpenRouter Document] Network error:", error.message);
        }
        return null;
    }
}

// POST /ai/summarize - Process and summarize a document (with OpenRouter fallback)
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

        let processedResult = null;

        // Try the primary AI service first
        try {
            console.log(`Attempting to process document via AI service at: ${AI_SERVICE_URL}/process`);

            let fileData = null;
            if (docData.filePath && fs.existsSync(docData.filePath)) {
                fileData = fs.readFileSync(docData.filePath, { encoding: 'base64' });
            }

            const aiResponse = await axios.post(`${AI_SERVICE_URL}/process`, {
                documentId,
                fileData,
                fileName: docData.fileName || 'document',
                userId
            }, { timeout: 60000 });

            processedResult = aiResponse.data;
        } catch (aiError) {
            console.warn("Primary AI service failed for document processing:", aiError.message);
        }

        // If primary failed, try OpenRouter fallback
        if (!processedResult) {
            console.log("Attempting OpenRouter fallback for document processing...");
            processedResult = await processDocumentWithOpenRouter(
                docData.fileName || 'document',
                docData.fileType || 'unknown'
            );
        }

        // If both failed, provide a basic fallback
        if (!processedResult) {
            console.log("Using static fallback for document processing");
            processedResult = {
                processedText: `Document: ${docData.fileName}\nUploaded successfully.`,
                doctorSummary: `Patient uploaded: ${docData.fileName}`,
                patientSummary: `Your document "${docData.fileName}" has been uploaded successfully. 

While our AI processing service is temporarily unavailable, your document is safely stored. Here's what you can do:

1. **Review your document** - Open and read through the contents
2. **Note key points** - Write down medications, dosages, and follow-up dates
3. **Prepare questions** - List anything you'd like to discuss with your doctor
4. **Keep for reference** - This document will be available in your account

⚠️ DISCLAIMER: This summary is for informational purposes only. Always consult your healthcare provider for medical advice.`,
                medications: [],
                followUps: [
                    { action: "Review the document and discuss with your healthcare provider", timing: "At next appointment" }
                ],
                redFlags: ["Contact your healthcare provider if you have questions about this document"]
            };
        }

        const { processedText, doctorSummary, patientSummary, medications, followUps, redFlags } = processedResult;

        // Update document with processed text
        await docRef.update({
            processedText: processedText || 'Document processed',
            processedAt: new Date().toISOString()
        });

        // Create visit summary in Firestore
        const summaryData = {
            userId,
            documentId,
            doctorSummary: doctorSummary || '',
            patientSummary: patientSummary || '',
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
                doctorSummary: doctorSummary || '',
                patientSummary: patientSummary || '',
                medications: medications || [],
                followUps: followUps || [],
                redFlags: redFlags || []
            }
        });
    } catch (error) {
        console.error('Error processing document:', error.message);
        res.status(500).json({ error: 'Failed to process document', details: error.message });
    }
});

// POST /ai/chat - Chat with AI assistant (with OpenRouter fallback)
router.post("/chat", verifyToken, async (req, res) => {
    try {
        const { message, mode, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        let aiResponse = null;

        // Try the primary AI service first
        try {
            console.log(`Attempting to call AI service at: ${AI_SERVICE_URL}/chat`);
            const response = await callAIService({ message, mode, context });
            aiResponse = response.data?.response;
        } catch (aiServiceError) {
            console.warn("Primary AI service failed:", aiServiceError.message);

            // Check if rate limited
            if (aiServiceError.response?.status === 429) {
                return res.status(429).json({
                    error: "Too many requests. Please wait 1 minute and try again."
                });
            }
        }

        // If primary service failed, try OpenRouter fallback
        if (!aiResponse) {
            console.log("Attempting OpenRouter fallback...");
            aiResponse = await chatWithOpenRouter(message, mode, context);
        }

        // If both failed, return a helpful error with fallback response
        if (!aiResponse) {
            console.error("Both AI service and OpenRouter fallback failed");

            // Provide a basic fallback response
            const fallbackResponse = mode === "pre_visit"
                ? `I understand you're preparing for a doctor visit. While I'm having temporary connectivity issues, here are some general tips:

1. **Write down your symptoms** - Include when they started and how severe they are
2. **List your medications** - Include any supplements
3. **Prepare questions** - Write them down so you don't forget
4. **Bring relevant documents** - Previous test results, records, etc.

Your question was: "${message}"

Please discuss this with your healthcare provider during your visit.

⚠️ Note: This is a fallback response. The AI service is temporarily unavailable.`
                : `I understand you have questions about your visit notes. While I'm having temporary connectivity issues, here are some general tips:

1. **Review your documents carefully** - Read through them at your own pace
2. **Note any unclear terms** - Ask your doctor to explain
3. **Follow medication instructions** - Take as prescribed
4. **Schedule follow-ups** - As recommended by your doctor

Your question was: "${message}"

Please contact your healthcare provider for specific questions.

⚠️ Note: This is a fallback response. The AI service is temporarily unavailable.`;

            return res.json({
                success: true,
                response: fallbackResponse,
                fallback: true
            });
        }

        res.json({
            success: true,
            response: aiResponse
        });

    } catch (err) {
        console.error("Chat error:", err.message);
        res.status(500).json({ error: "Chat service failed. Please try again." });
    }
});

// GET /ai/symptoms/list - Example symptoms list route
router.get("/symptoms/list", verifyToken, async (req, res) => {
    try {
        // Return common symptom suggestions
        const symptoms = [
            "Fever",
            "Cough",
            "Headache",
            "Fatigue",
            "Sore throat",
            "Shortness of breath",
            "Nausea",
            "Dizziness",
            "Chest pain",
            "Back pain"
        ];

        res.json(symptoms);

    } catch (err) {
        console.error("Symptoms list error:", err.message);
        res.status(500).json({ error: "Failed to fetch symptoms" });
    }
});

// GET /ai/summary - Get latest AI summary for user
router.get('/summary', verifyToken, async (req, res) => {
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

        // Sort client-side to get the latest
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
