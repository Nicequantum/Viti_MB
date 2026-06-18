import { grokChat } from '../../lib/grok-client';
import { buildWarrantyStoryUserMessage, SYSTEM_PROMPT } from '../../prompts/warrantyStory';
import type { RepairLine, RepairOrder } from '../../types';

export async function generateWarrantyStory(
  ro: RepairOrder,
  line: RepairLine,
  apiKey: string,
  historyContext = ''
): Promise<string> {
  const userMessage = buildWarrantyStoryUserMessage(ro, line, historyContext);
  const story = await grokChat(
    apiKey,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    { temperature: 0.25, max_tokens: 1100, context: 'story-generation' }
  );
  return story || 'No story generated.';
}