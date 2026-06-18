import { useAppStore } from '../store/appStore';

export interface LoadingOverlayProps {
  visible: boolean;
  message: string;
  progress?: number;
}

export function useLoadingState() {
  const isProcessingOCR = useAppStore((s) => s.isProcessingOCR);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const isReviewing = useAppStore((s) => s.isReviewing);
  const ocrProgress = useAppStore((s) => s.ocrProgress);
  const loadingMessage = useAppStore((s) => s.loadingMessage);

  const overlay: LoadingOverlayProps = {
    visible: isProcessingOCR || isGenerating || isReviewing,
    message: loadingMessage || (isGenerating ? 'Generating with Grok…' : 'Processing…'),
    progress: isProcessingOCR ? ocrProgress : undefined,
  };

  return { isProcessingOCR, ocrProgress, isGenerating, isReviewing, overlay };
}