import { SERVICES_CONFIG } from './services-config';

const { URL, MODEL } = SERVICES_CONFIG.OLLAMA;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OllamaClient {
  /**
   * Send messages to the LLM and get a complete response.
   */
  async generateResponse(messages: ChatMessage[], opts?: { maxTokens?: number; signal?: AbortSignal }): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const onExternalAbort = () => controller.abort();
    opts?.signal?.addEventListener('abort', onExternalAbort);

    try {
      const response = await fetch(`${URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,
          options: {
            num_ctx: 4096,
            num_predict: opts?.maxTokens ?? 100,
            temperature: 0.7,
            top_p: 0.9,
            repeat_penalty: 1.1,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || '';
    } finally {
      clearTimeout(timeout);
      opts?.signal?.removeEventListener('abort', onExternalAbort);
    }
  }

  /**
   * Send messages to the LLM and stream the response token by token.
   * Yields content strings as they arrive.
   */
  async *generateStreamingResponse(messages: ChatMessage[]): AsyncGenerator<string> {
    const response = await fetch(`${URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM streaming request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.done) return;
            if (parsed.message?.content) {
              yield parsed.message.content;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          if (parsed.message?.content && !parsed.done) {
            yield parsed.message.content;
          }
        } catch {
          // Skip malformed final chunk
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Check if the Ollama proxy is reachable.
   */
  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${URL}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ollamaClient = new OllamaClient();
