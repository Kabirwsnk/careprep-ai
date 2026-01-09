import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /auth/verify - Verify Firebase token
router.post('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

export default router;
