import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authenticateUser);

// Student only route
router.get('/student/dashboard', requireRole(UserRole.JOB_SEEKER), (req, res) => {
    res.json({ message: 'Welcome to Student Dashboard', user: req.user });
});

// Employer only route
router.get('/employer/dashboard', requireRole(UserRole.EMPLOYER), (req, res) => {
    res.json({ message: 'Welcome to Employer Dashboard', user: req.user });
});

export default router;
