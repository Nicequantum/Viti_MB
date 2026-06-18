import { create } from 'zustand';
import type { AppView } from '../types';

interface AppState {
  view: AppView;
  searchTerm: string;
  loadingMessage: string;
  isProcessingOCR: boolean;
  isGenerating: boolean;
  isReviewing: boolean;
  ocrProgress: number;
  setView: (view: AppView) => void;
  setSearchTerm: (term: string) => void;
  setLoadingMessage: (msg: string) => void;
  setProcessingOCR: (active: boolean, progress?: number) => void;
  setGenerating: (active: boolean) => void;
  setReviewing: (active: boolean) => void;
  setOcrProgress: (progress: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'home',
  searchTerm: '',
  loadingMessage: '',
  isProcessingOCR: false,
  isGenerating: false,
  isReviewing: false,
  ocrProgress: 0,
  setView: (view) => set({ view }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setLoadingMessage: (loadingMessage) => set({ loadingMessage }),
  setProcessingOCR: (isProcessingOCR, progress) =>
    set((s) => ({
      isProcessingOCR,
      ocrProgress: progress ?? (isProcessingOCR ? s.ocrProgress : 0),
    })),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setReviewing: (isReviewing) => set({ isReviewing }),
  setOcrProgress: (ocrProgress) => set({ ocrProgress }),
}));