import { useMemo } from 'react';
import { useRepairOrderStore } from '../store/repairOrderStore';
import type { RepairLine } from '../types';

export function useActiveLine(): RepairLine | undefined {
  const currentLineId = useRepairOrderStore((s) => s.currentLineId);
  const currentRO = useRepairOrderStore((s) => s.currentRO);

  return useMemo(
    () => (currentLineId ? currentRO?.repairLines.find((l) => l.id === currentLineId) : undefined),
    [currentLineId, currentRO]
  );
}