import { useAppStore } from '../store/appStore';

export function useOcrState() {
  const isProcessingOCR = useAppStore((s) => s.isProcessingOCR);
  const ocrProgress = useAppStore((s) => s.ocrProgress);

  return { isProcessingOCR, ocrProgress };
}