import { useAppStore } from '../store/appStore';

export function useLoadingOverlay() {
  const isProcessingOCR = useAppStore((s) => s.isProcessingOCR);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const isReviewing = useAppStore((s) => s.isReviewing);
  const ocrProgress = useAppStore((s) => s.ocrProgress);
  const loadingMessage = useAppStore((s) => s.loadingMessage);

  const visible = isProcessingOCR || isGenerating || isReviewing;

  return {
    visible,
    message: loadingMessage || (isGenerating ? 'Generating with Grok…' : 'Processing…'),
    progress: isProcessingOCR ? ocrProgress : undefined,
  };
}