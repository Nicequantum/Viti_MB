import { useMemo } from 'react';
import type { StoryQualityResult, StoryReviewResult } from '../prompts/storyQuality';
import { useBenzBotStore } from '../store/benzbotStore';
import { useRepairOrderStore } from '../store/repairOrderStore';
import type { RepairLine } from '../types';

export function useActiveLine(): {
  line: RepairLine | undefined;
  storyQuality: StoryQualityResult | null;
  storyReview: StoryReviewResult | null;
  storyQualityStale: boolean;
} {
  const currentLineId = useRepairOrderStore((s) => s.currentLineId);
  const currentRO = useRepairOrderStore((s) => s.currentRO);

  const line = useMemo(
    () => (currentLineId ? currentRO?.repairLines.find((l) => l.id === currentLineId) : undefined),
    [currentLineId, currentRO]
  );

  const storyText = line?.warrantyStory;

  const storyQuality = useBenzBotStore((s) =>
    currentLineId ? s.getQualityForLine(currentLineId, storyText) : null
  );
  const storyReview = useBenzBotStore((s) =>
    currentLineId ? s.getReviewForLine(currentLineId) : null
  );
  const storyQualityStale = useBenzBotStore((s) =>
    currentLineId ? s.isStaleForLine(currentLineId, storyText) : false
  );

  return { line, storyQuality, storyReview, storyQualityStale };
}