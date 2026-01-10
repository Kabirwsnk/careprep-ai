import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import symptomsRoutes from './routes/symptoms.js';
import documentsRoutes from './routes/documents.js';
import aiRoutes from './routes/ai.js';
import visitSummariesRoutes from './routes/visitSummaries.js';
import { db, isFirebaseReady } from './config/firebaseAdmin.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://careprep-ai.web.app',
    'https://careprep-ai-frontend.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', async (req, res) => {
    const firebaseReady = isFirebaseReady();

    if (!firebaseReady || !db) {
        console.error('Health check: Firebase not initialized');
        return res.status(503).json({
            status: 'unhealthy',
            error: 'Firebase not initialized - check environment variables',
            timestamp: new Date().toISOString(),
            firebaseReady: false
        });
    }

    try {
        // Check Firestore connection by reading a test doc
        const healthDoc = await db.collection('_health').doc('check').get();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'Firestore connected',
            firebaseReady: true,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
            firebaseReady: true
        });
    }
});

// Routes
app.use('/auth', authRoutes);
app.use('/symptoms', symptomsRoutes);
app.use('/documents', documentsRoutes);
app.use('/ai', aiRoutes);
app.use('/visit-summaries', visitSummariesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 CarePrep AI Backend running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Database: Firebase Firestore`);
    console.log(`🔐 Auth: Firebase`);
    console.log(`\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
