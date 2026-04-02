import express from 'express';
import { createOrUpdateProfile, getProfile, getDashboardStats } from '../controllers/jobSeeker.controller';
import { getMyApplications } from '../controllers/application.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateUser);

// @ts-ignore
router.post('/profile', createOrUpdateProfile);
// @ts-ignore
router.get('/profile', getProfile);
// @ts-ignore
router.get('/dashboard-stats', getDashboardStats);
// @ts-ignore
router.get('/applications', getMyApplications);

export default router;
