import { useAppStore } from '../store/appStore';

export function useStoryWorkflow() {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const isReviewing = useAppStore((s) => s.isReviewing);

  return { isGenerating, isReviewing };
}