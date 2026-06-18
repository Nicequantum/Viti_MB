import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useRepairOrderStore } from '../store/repairOrderStore';
import type { RepairOrder } from '../types';

function matchesSearchTerm(ro: RepairOrder, term: string): boolean {
  return (
    ro.roNumber.toLowerCase().includes(term) ||
    (ro.vehicle.make?.toLowerCase().includes(term) ?? false) ||
    (ro.vehicle.model?.toLowerCase().includes(term) ?? false) ||
    (ro.vehicle.year?.includes(term) ?? false) ||
    (ro.vehicle.vin?.toLowerCase().includes(term) ?? false)
  );
}

export function useRepairOrderSearch() {
  const searchTerm = useAppStore((s) => s.searchTerm);
  const setSearchTerm = useAppStore((s) => s.setSearchTerm);
  const allROs = useRepairOrderStore((s) => s.allROs);

  const filteredROs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allROs
      .filter((ro) => matchesSearchTerm(ro, term))
      .sort((a, b) => ((b.createdAt || '0') > (a.createdAt || '0') ? 1 : -1));
  }, [allROs, searchTerm]);

  return { searchTerm, setSearchTerm, filteredROs };
}