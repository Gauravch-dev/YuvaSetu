import axios from 'axios';
import { Readable } from 'stream';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default to 'Rachel' if not set

export const streamTextToSpeech = async (text: string, voiceId?: string): Promise<Readable> => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
  }

  const selectedVoiceId = voiceId || ELEVENLABS_VOICE_ID;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream`;

  try {
    const response = await axios.post(
      url,
      {
        text,
        model_id: 'eleven_flash_v2_5', // Updated to latest fast model (Free Tier supported)
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 0.82, 
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'stream',
      }
    );

    return response.data;
  } catch (error: any) {
    let errorMessage = error.message;

    if (error.response?.data) {
        // If the response is a stream (which it is due to responseType: 'stream'),
        // we need to consume it to see the error text.
        try {
            const chunks = [];
            for await (const chunk of error.response.data) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const errorJson = JSON.parse(buffer.toString());
            errorMessage = errorJson.detail?.message || errorJson.message || buffer.toString();
        } catch (streamError) {
             // Fallback if parsing fails
             console.error("Error parsing error stream:", streamError);
        }
    }

    console.error('ElevenLabs TTS Error:', errorMessage);
    throw new Error(errorMessage || 'Failed to stream audio from ElevenLabs');
  }
};
