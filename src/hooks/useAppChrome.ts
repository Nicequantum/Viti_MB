import { useAppStore } from '../store/appStore';

export function useAppChrome() {
  const view = useAppStore((s) => s.view);
  const isProcessingOCR = useAppStore((s) => s.isProcessingOCR);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const isReviewing = useAppStore((s) => s.isReviewing);
  const ocrProgress = useAppStore((s) => s.ocrProgress);
  const loadingMessage = useAppStore((s) => s.loadingMessage);

  const showHeader = view !== 'home' && view !== 'settings';
  const showLoading = isProcessingOCR || isGenerating || isReviewing;

  return {
    view,
    showHeader,
    showLoading,
    loadingOverlay: {
      visible: showLoading,
      message: loadingMessage || (isGenerating ? 'Generating with Grok…' : 'Processing…'),
      progress: isProcessingOCR ? ocrProgress : undefined,
    },
    ocr: { isProcessingOCR, ocrProgress },
    story: { isGenerating, isReviewing },
  };
}