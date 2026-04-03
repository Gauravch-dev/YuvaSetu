import { SERVICES_CONFIG } from './services-config';

const { URL } = SERVICES_CONFIG.EDGE_TTS;

class EdgeTTSClient {
  /**
   * Synthesize text to speech audio.
   * Returns the raw audio bytes as an ArrayBuffer.
   */
  async synthesize(text: string, voice?: string): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TTS synthesis failed: ${response.status} ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Check if the TTS server is reachable.
   */
  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${URL}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const edgeTTSClient = new EdgeTTSClient();
