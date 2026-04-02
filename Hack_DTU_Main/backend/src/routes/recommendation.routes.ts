import express from 'express';
import { getRecommendedJobs, getRecommendedCandidates } from '../controllers/recommendation.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Seeker Routes
router.get('/jobs', authenticateUser, getRecommendedJobs);

// Employer Routes
router.get('/candidates/:jobId', authenticateUser, getRecommendedCandidates);

export default router;
