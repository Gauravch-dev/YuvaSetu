import { Router } from 'express';
import { upload, uploadFile } from '../controllers/upload.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Protect upload route if needed, or allow public uploads depending on requirement
// Generally good to protect
router.post('/', authenticateUser, upload.single('file'), uploadFile);

export default router;
