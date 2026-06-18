import { logger } from './logger';

export interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface GrokChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class GrokApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'GrokApiError';
  }
}

export async function grokChat(
  apiKey: string,
  messages: GrokChatMessage[],
  options?: { temperature?: number; max_tokens?: number; context?: string }
): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-3',
      messages,
      temperature: options?.temperature ?? 0.25,
      max_tokens: options?.max_tokens ?? 900,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error('Grok API request failed', options?.context ?? 'grok', { status: response.status, err });
    throw new GrokApiError(`Grok API error: ${response.status} ${err}`, response.status);
  }

  const apiResponse = (await response.json()) as GrokChatResponse;
  return apiResponse.choices?.[0]?.message?.content?.trim() || '';
}