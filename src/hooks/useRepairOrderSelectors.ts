import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useRepairOrderStore } from '../store/repairOrderStore';

export function useRepairOrderSelectors() {
  const searchTerm = useAppStore((s) => s.searchTerm);
  const setSearchTerm = useAppStore((s) => s.setSearchTerm);

  const currentRO = useRepairOrderStore((s) => s.currentRO);
  const currentLineId = useRepairOrderStore((s) => s.currentLineId);
  const pendingROImages = useRepairOrderStore((s) => s.pendingROImages);
  const setPendingROImages = useRepairOrderStore((s) => s.setPendingROImages);
  const allROs = useRepairOrderStore((s) => s.allROs);

  const filteredROs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allROs
      .filter(
        (ro) =>
          ro.roNumber.toLowerCase().includes(term) ||
          (ro.vehicle.make && ro.vehicle.make.toLowerCase().includes(term)) ||
          (ro.vehicle.model && ro.vehicle.model.toLowerCase().includes(term)) ||
          (ro.vehicle.year && ro.vehicle.year.includes(term)) ||
          (ro.vehicle.vin && ro.vehicle.vin.toLowerCase().includes(term))
      )
      .sort((a, b) => ((b.createdAt || '0') > (a.createdAt || '0') ? 1 : -1));
  }, [allROs, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    currentRO,
    currentLineId,
    pendingROImages,
    setPendingROImages,
    filteredROs,
  };
}