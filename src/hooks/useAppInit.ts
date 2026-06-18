import { useEffect } from 'react';
import { hydrateRepairOrders } from '../services/repair-order.service';
import { useAuthStore } from '../store/authStore';
import { useRepairOrderStore } from '../store/repairOrderStore';

export function useAppInit(): boolean {
  const hydrated = useRepairOrderStore((s) => s.hydrated);

  useEffect(() => {
    useAuthStore.getState().initialize();
    void hydrateRepairOrders();
  }, []);

  return hydrated;
}