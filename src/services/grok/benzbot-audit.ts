import { grokChat } from '../../lib/grok-client';
import {
  buildStoryReviewUserMessage,
  buildStoryScoreUserMessage,
  parseStoryQualityResponse,
  parseStoryReviewResponse,
  STORY_REVIEW_SYSTEM_PROMPT,
  STORY_SCORE_SYSTEM_PROMPT,
  type StoryQualityResult,
  type StoryReviewResult,
} from '../../prompts/storyQuality';
import type { RepairLine, RepairOrder } from '../../types';

export async function scoreWarrantyStory(
  ro: RepairOrder,
  line: RepairLine,
  warrantyStory: string,
  apiKey: string
): Promise<StoryQualityResult> {
  const raw = await grokChat(
    apiKey,
    [
      { role: 'system', content: STORY_SCORE_SYSTEM_PROMPT },
      { role: 'user', content: buildStoryScoreUserMessage(ro, line, warrantyStory) },
    ],
    { temperature: 0.1, max_tokens: 800, context: 'benzbot-score' }
  );
  return { ...parseStoryQualityResponse(raw), scoredAgainstStory: warrantyStory };
}

export async function reviewWarrantyStory(
  ro: RepairOrder,
  line: RepairLine,
  warrantyStory: string,
  apiKey: string
): Promise<StoryReviewResult> {
  const raw = await grokChat(
    apiKey,
    [
      { role: 'system', content: STORY_REVIEW_SYSTEM_PROMPT },
      { role: 'user', content: buildStoryReviewUserMessage(ro, line, warrantyStory) },
    ],
    { temperature: 0.15, max_tokens: 1000, context: 'benzbot-review' }
  );
  return { ...parseStoryReviewResponse(raw), scoredAgainstStory: warrantyStory };
}