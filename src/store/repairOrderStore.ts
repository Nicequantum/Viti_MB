import { create } from 'zustand';
import type { PendingROImage, RepairLine, RepairOrder } from '../types';

interface RepairOrderState {
  allROs: RepairOrder[];
  currentRO: RepairOrder | null;
  currentLineId: string | null;
  pendingROImages: PendingROImage[];
  hydrated: boolean;
  setAllROs: (ros: RepairOrder[]) => void;
  setCurrentRO: (ro: RepairOrder | null) => void;
  setCurrentLineId: (id: string | null) => void;
  setPendingROImages: (images: PendingROImage[] | ((prev: PendingROImage[]) => PendingROImage[])) => void;
  setHydrated: (hydrated: boolean) => void;
  upsertRO: (ro: RepairOrder) => void;
  removeRO: (id: string) => void;
  getCurrentLine: () => RepairLine | undefined;
  getFilteredROs: (searchTerm: string) => RepairOrder[];
  setLineId: (lineId: string | null) => void;
}

export const useRepairOrderStore = create<RepairOrderState>((set, get) => ({
  allROs: [],
  currentRO: null,
  currentLineId: null,
  pendingROImages: [],
  hydrated: false,

  setAllROs: (allROs) => set({ allROs }),
  setCurrentRO: (currentRO) => set({ currentRO }),
  setCurrentLineId: (currentLineId) => set({ currentLineId }),
  setPendingROImages: (pendingROImages) =>
    set((s) => ({
      pendingROImages:
        typeof pendingROImages === 'function' ? pendingROImages(s.pendingROImages) : pendingROImages,
    })),
  setHydrated: (hydrated) => set({ hydrated }),

  upsertRO: (ro) =>
    set((s) => {
      const idx = s.allROs.findIndex((r) => r.id === ro.id);
      const allROs = idx >= 0 ? s.allROs.map((r, i) => (i === idx ? ro : r)) : [ro, ...s.allROs];
      return {
        allROs,
        currentRO: s.currentRO?.id === ro.id ? ro : s.currentRO,
      };
    }),

  removeRO: (id) =>
    set((s) => ({
      allROs: s.allROs.filter((r) => r.id !== id),
      currentRO: s.currentRO?.id === id ? null : s.currentRO,
      currentLineId: s.currentRO?.id === id ? null : s.currentLineId,
    })),

  getCurrentLine: () => {
    const { currentRO, currentLineId } = get();
    return currentRO?.repairLines.find((l) => l.id === currentLineId);
  },

  getFilteredROs: (searchTerm) => {
    const term = searchTerm.toLowerCase();
    return get()
      .allROs.filter(
        (ro) =>
          ro.roNumber.toLowerCase().includes(term) ||
          (ro.vehicle.make && ro.vehicle.make.toLowerCase().includes(term)) ||
          (ro.vehicle.model && ro.vehicle.model.toLowerCase().includes(term)) ||
          (ro.vehicle.year && ro.vehicle.year.includes(term)) ||
          (ro.vehicle.vin && ro.vehicle.vin.toLowerCase().includes(term))
      )
      .sort((a, b) => ((b.createdAt || '0') > (a.createdAt || '0') ? 1 : -1));
  },

  setLineId: (currentLineId) => set({ currentLineId }),
}));