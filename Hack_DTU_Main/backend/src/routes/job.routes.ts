import express from 'express';
import { authenticateUser as protect } from '../middleware/auth.middleware'; // Reuse renamed import
import { createJob, getEmployerJobs, getJobById, updateJob, deleteJob } from '../controllers/job.controller';
import { applyToJob, updateApplicationStatus, getJobCandidates } from '../controllers/application.controller';
import { getJobAnalytics } from '../controllers/analytics.controller';

const router = express.Router();

// Employer Routes (Protected)
router.post('/', protect, createJob);
router.get('/employer', protect, getEmployerJobs);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

// Application Routes
router.post('/:id/apply', protect, applyToJob);
router.patch('/:id/candidates/:userId/status', protect, updateApplicationStatus);
router.get('/:id/candidates', protect, getJobCandidates);

// Analytics
router.get('/:id/analytics', protect, getJobAnalytics);

router.get('/:id', getJobById); // Public fetch usually, but ID based

export default router;
