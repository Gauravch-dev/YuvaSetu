import express from 'express';
import { authenticateUser as protect } from '../middleware/auth.middleware';
import {
    generateInterview,
    getInterviews,
    getInterviewById,
    saveFeedback,
    getFeedback,
    getMyFeedback,
} from '../controllers/interview.controller';

const router = express.Router();

// All routes require authentication
router.post('/generate', protect, generateInterview);
router.get('/list', protect, getInterviews);
router.get('/my-feedback', protect, getMyFeedback);
router.post('/feedback', protect, saveFeedback);
router.get('/:id/feedback', protect, getFeedback);
router.get('/:id', protect, getInterviewById);

export default router;
