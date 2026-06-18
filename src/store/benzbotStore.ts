import { create } from 'zustand';
import type { StoryQualityResult, StoryReviewResult } from '../prompts/storyQuality';

interface BenzBotState {
  qualityByLine: Record<string, StoryQualityResult>;
  reviewByLine: Record<string, StoryReviewResult>;
  setQuality: (lineId: string, quality: StoryQualityResult) => void;
  setReview: (lineId: string, review: StoryReviewResult) => void;
  clearReview: (lineId: string) => void;
  getQualityForLine: (lineId: string | null, storyText?: string) => StoryQualityResult | null;
  getReviewForLine: (lineId: string | null) => StoryReviewResult | null;
  isStaleForLine: (lineId: string | null, storyText?: string) => boolean;
}

export const useBenzBotStore = create<BenzBotState>((set, get) => ({
  qualityByLine: {},
  reviewByLine: {},

  setQuality: (lineId, quality) =>
    set((s) => ({ qualityByLine: { ...s.qualityByLine, [lineId]: quality } })),

  setReview: (lineId, review) =>
    set((s) => ({
      qualityByLine: { ...s.qualityByLine, [lineId]: review },
      reviewByLine: { ...s.reviewByLine, [lineId]: review },
    })),

  clearReview: (lineId) =>
    set((s) => {
      const next = { ...s.reviewByLine };
      delete next[lineId];
      return { reviewByLine: next };
    }),

  getQualityForLine: (lineId, storyText) => {
    if (!lineId || !storyText) return null;
    const quality = get().qualityByLine[lineId];
    if (!quality) return null;
    if (quality.scoredAgainstStory && quality.scoredAgainstStory !== storyText) return null;
    return quality;
  },

  getReviewForLine: (lineId) => {
    if (!lineId) return null;
    const quality = get().getQualityForLine(lineId);
    if (!quality) return null;
    return get().reviewByLine[lineId] ?? null;
  },

  isStaleForLine: (lineId, storyText) => {
    if (!lineId || !storyText) return false;
    const quality = get().qualityByLine[lineId];
    if (!quality) return false;
    return quality.scoredAgainstStory !== storyText;
  },
}));