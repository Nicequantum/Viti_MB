import type { StoryQualityResult, StoryReviewResult } from '../prompts/storyQuality';
import { useBenzBotStore } from '../store/benzbotStore';

interface LineAuditState {
  storyQuality: StoryQualityResult | null;
  storyReview: StoryReviewResult | null;
  storyQualityStale: boolean;
}

export function useLineAuditState(
  lineId: string | null | undefined,
  storyText: string | undefined
): LineAuditState {
  const storyQuality = useBenzBotStore((s) =>
    lineId ? s.getQualityForLine(lineId, storyText) : null
  );
  const storyReview = useBenzBotStore((s) => (lineId ? s.getReviewForLine(lineId) : null));
  const storyQualityStale = useBenzBotStore((s) =>
    lineId ? s.isStaleForLine(lineId, storyText) : false
  );

  return { storyQuality, storyReview, storyQualityStale };
}