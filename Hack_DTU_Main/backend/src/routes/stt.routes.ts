import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
// Keep valid imports
import { transcribeAudio } from '../services/stt.service';

const router = express.Router();

// Setup Multer for temp storage
// We accept any file for now, but frontend should send webm
const upload = multer({ 
    dest: 'temp_uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure temp_uploads exists
// This runs once on module load, or we can check inside the handler
if (!fs.existsSync('temp_uploads')) {
    try {
        fs.mkdirSync('temp_uploads');
    } catch (e) {
        console.error("Could not create temp_uploads dir", e);
    }
}

router.post('/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const filePath = req.file.path;
    const language = req.body.language || 'en-US'; // Default to English

    try {
        console.log(`Processing audio file: ${filePath} [Language: ${language}]`);
        
        // Call the service
        const text = await transcribeAudio(filePath, language);
        
        // Cleanup file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete temp file:", filePath, err);
        });

        res.json({ text });

    } catch (error: any) {
        console.error("Transcription error:", error);
        
        // Cleanup file on error too
        fs.unlink(filePath, (err) => { 
            if (err) console.error("Failed to delete temp file:", filePath, err); 
        });

        res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
    }
});

export default router;
