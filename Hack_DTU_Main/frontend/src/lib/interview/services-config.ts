export const SERVICES_CONFIG = {
  EDGE_TTS: {
    URL: 'http://localhost:5100',
  },
  WHISPER_STT: {
    URL: 'http://localhost:5200',
  },
  OLLAMA: {
    // Goes through Express backend proxy to avoid CORS
    URL: 'http://localhost:5000/api/ollama-proxy',
    MODEL: 'gemma3:4b',
  },
} as const;

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  CHUNK_SIZE: 1024,
  MIME_TYPE: 'audio/wav',
} as const;
