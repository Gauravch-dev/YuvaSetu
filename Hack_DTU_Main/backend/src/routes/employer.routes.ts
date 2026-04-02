import express from 'express';
import { authenticateUser as protect } from '../middleware/auth.middleware';
import { getCompanyProfile, updateCompanyProfile, getEmployerDashboardStats, getEmployerCandidateProfile } from '../controllers/employer.controller';

const router = express.Router();

router.get('/profile', protect, getCompanyProfile);
router.post('/profile', protect, updateCompanyProfile);
router.get('/dashboard-stats', protect, getEmployerDashboardStats);
router.get('/candidate/:userId', protect, getEmployerCandidateProfile);

export default router;
