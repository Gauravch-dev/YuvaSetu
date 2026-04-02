import express from 'express';
import { parseResumeWithAI, analyzeSkillGap } from '../controllers/ondemand.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Protected route: only logged in users can use the AI parser (to save credits)
router.post('/parse-resume', authenticateUser, parseResumeWithAI);
router.post('/analyze-gap', authenticateUser, analyzeSkillGap);

export default router;
