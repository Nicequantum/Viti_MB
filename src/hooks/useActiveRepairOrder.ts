import { useRepairOrderStore } from '../store/repairOrderStore';

export function useActiveRepairOrder() {
  const currentRO = useRepairOrderStore((s) => s.currentRO);
  const pendingROImages = useRepairOrderStore((s) => s.pendingROImages);
  const setPendingROImages = useRepairOrderStore((s) => s.setPendingROImages);

  return { currentRO, pendingROImages, setPendingROImages };
}