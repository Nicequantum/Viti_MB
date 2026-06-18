import { useCallback } from 'react';
import * as repairOrderService from '../services/repair-order.service';
import type { RepairLine, RepairOrder } from '../types';

export function useRepairOrderActions() {
  const navigateTo = useCallback(repairOrderService.navigateTo, []);

  const home = {
    addROPhoto: repairOrderService.addROPhotoPicker,
    createManualRO: useCallback(() => void repairOrderService.createManualRO(), []),
    processPending: useCallback(() => void repairOrderService.processPendingROImages(), []),
    openRO: useCallback((ro: RepairOrder) => repairOrderService.openRepairOrder(ro), []),
    deleteRO: useCallback((id: string) => void repairOrderService.deleteRepairOrder(id), []),
    openSettings: useCallback(() => navigateTo('settings'), [navigateTo]),
  };

  const ro = {
    done: useCallback(() => navigateTo('home'), [navigateTo]),
    updateRONumber: repairOrderService.updateRONumber,
    updateVehicle: repairOrderService.updateVehicle,
    updateCustomer: repairOrderService.updateCustomer,
    addComplaint: repairOrderService.addComplaint,
    editComplaint: repairOrderService.editComplaint,
    removeComplaint: repairOrderService.removeComplaint,
    addROXentryPhotos: repairOrderService.addROXentryPhotos,
    addRepairLine: repairOrderService.addRepairLine,
    openLine: useCallback((lineId: string) => navigateTo('line', lineId), [navigateTo]),
    deleteRO: useCallback((id: string) => void repairOrderService.deleteRepairOrder(id), []),
  };

  const line = {
    back: useCallback(() => navigateTo('ro'), [navigateTo]),
    updateLine: useCallback((lineId: string, updates: Partial<RepairLine>) => {
      repairOrderService.updateLine(lineId, updates);
    }, []),
    addXentryPhotos: useCallback((lineId: string) => repairOrderService.addXentryPhotos(lineId), []),
    applySmartDefaults: useCallback(
      (lineId: string) => repairOrderService.applySmartDefaultsToLine(lineId),
      []
    ),
    generateStory: useCallback((lineId: string) => void repairOrderService.generateStoryForLine(lineId), []),
    reviewStory: useCallback((lineId: string) => void repairOrderService.reviewStoryForLine(lineId), []),
  };

  const settings = {
    back: useCallback(
      (hasCurrentRO: boolean) => navigateTo(hasCurrentRO ? 'ro' : 'home'),
      [navigateTo]
    ),
  };

  return { navigateTo, home, ro, line, settings };
}