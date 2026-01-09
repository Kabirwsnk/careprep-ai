import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../middleware/authMiddleware.js';
import { db } from '../config/firebaseAdmin.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userDir = path.join(uploadsDir, req.user.uid);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const fileId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${fileId}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: PDF, Images, CSV, Excel'));
        }
    }
});

// POST /documents/upload - Upload a document
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.uid;
        const file = req.file;
        const fileId = path.basename(file.filename, path.extname(file.filename));

        const documentData = {
            userId,
            fileId,
            fileName: file.originalname,
            fileType: file.mimetype,
            filePath: file.path,
            fileSize: file.size,
            processedText: null,
            processedAt: null,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('documents').add(documentData);

        res.status(201).json({
            success: true,
            id: docRef.id,
            document: { id: docRef.id, ...documentData }
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// GET /documents/list - Get user's documents
router.get('/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const snapshot = await db.collection('documents')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const documents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                fileId: data.fileId,
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize,
                processedText: data.processedText,
                createdAt: data.createdAt
            };
        });

        res.json({ documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// GET /documents/:id - Get specific document
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const docRef = db.collection('documents').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({ document: { id: doc.id, ...data } });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// GET /documents/:id/file - Download/serve file
router.get('/:id/file', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const docRef = db.collection('documents').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!fs.existsSync(data.filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.setHeader('Content-Type', data.fileType);
        res.setHeader('Content-Disposition', `inline; filename="${data.fileName}"`);
        res.sendFile(path.resolve(data.filePath));
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// DELETE /documents/:id - Delete a document
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const docRef = db.collection('documents').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const data = doc.data();
        if (data.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Delete from Firestore
        await docRef.delete();

        // Delete file from disk
        if (data.filePath && fs.existsSync(data.filePath)) {
            fs.unlinkSync(data.filePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export default router;
