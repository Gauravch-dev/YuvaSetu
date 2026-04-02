import express from 'express';
import { structureProfileData } from '../services/stt.service';

const router = express.Router();

router.post('/structure', async (req, res) => {
    try {
        const { context } = req.body;
        if (!context) {
            return res.status(400).json({ error: 'Context is required' });
        }

        console.log("Structuring Profile Data for:", context.name);
        const structuredData = await structureProfileData(context);
        
        res.json(structuredData);

    } catch (error: any) {
        console.error("Structuring Error:", error);
        res.status(500).json({ error: error.message || 'Failed to structure data' });
    }
});

export default router;
