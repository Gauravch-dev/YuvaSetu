import express from 'express';
import { register, login, getMe, completeOnboarding, updateProfile, checkForgotPassword, deleteAccount } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { loginRateLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/forgot-password-check', checkForgotPassword);
router.get('/me', authenticateUser, getMe);
router.post('/onboarding/complete', authenticateUser, completeOnboarding);
router.patch('/profile', authenticateUser, updateProfile);
router.delete('/me', authenticateUser, deleteAccount);

export default router;
