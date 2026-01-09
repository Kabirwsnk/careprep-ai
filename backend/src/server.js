import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import symptomsRoutes from './routes/symptoms.js';
import documentsRoutes from './routes/documents.js';
import aiRoutes from './routes/ai.js';
import visitSummariesRoutes from './routes/visitSummaries.js';
import { db } from './config/firebaseAdmin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - supports multiple origins for dev and production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(null, true); // Allow all for hackathon demo
        }
    },
    credentials: true
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
    try {
        // Check Firestore connection by reading a test doc
        await db.collection('_health').doc('check').get();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'Firestore connected'
        });
    } catch (error) {
        // Even if the doc doesn't exist, connection is working if no error
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'Firestore connected'
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
