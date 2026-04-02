import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { sendSuccess, sendError } from '../utils/response';

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (Images only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'));
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadFile = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return sendError(res, 400, 'No file uploaded', 'NO_FILE');
        }

        // Construct URL
        // req.protocol + '://' + req.get('host')
        // Ideally use ENV variable for base URL in production, but this works for simple setup
        const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        return sendSuccess(res, { url: fileUrl }, 'File uploaded successfully');
    } catch (error) {
        console.error('Upload Error:', error);
        return sendError(res, 500, 'File upload failed', 'UPLOAD_ERROR');
    }
};
