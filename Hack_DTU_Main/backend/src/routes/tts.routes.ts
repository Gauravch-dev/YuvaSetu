import express from 'express';
import { streamTextToSpeech } from '../services/tts.service';

const router = express.Router();

router.post('/stream', async (req, res) => {
  const { text, voiceId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    const audioStream = await streamTextToSpeech(text, voiceId);
    audioStream.pipe(res);
    
    audioStream.on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).end();
    });

  } catch (error: any) {
    console.error('TTS Route Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate speech' });
  }
});

export default router;
