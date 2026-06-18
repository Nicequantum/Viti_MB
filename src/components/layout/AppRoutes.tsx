import { SettingsView } from '../../features/auth/SettingsView';
import { LineView } from '../../features/lines/LineView';
import { HomeView } from '../../features/repair-orders/HomeView';
import { ROView } from '../../features/repair-orders/ROView';
import { useActiveLine } from '../../hooks/useActiveLine';
import { useActiveRepairOrder } from '../../hooks/useActiveRepairOrder';
import { useLineAuditState } from '../../hooks/useLineAuditState';
import { useOcrState } from '../../hooks/useOcrState';
import { useRepairOrderSearch } from '../../hooks/useRepairOrderSearch';
import { useRequireApiKey } from '../../hooks/useRequireApiKey';
import { useStoryWorkflow } from '../../hooks/useStoryWorkflow';
import * as repairOrderService from '../../services/repair-order.service';
import { useAuthStore } from '../../store/authStore';
import type { AppView } from '../../types';

interface AppRoutesProps {
  view: AppView;
}

export function AppRoutes({ view }: AppRoutesProps) {
  const requireApiKey = useRequireApiKey();
  const hasApiKey = useAuthStore((s) => !!s.apiKey);

  const { isProcessingOCR, ocrProgress } = useOcrState();
  const { isGenerating, isReviewing } = useStoryWorkflow();
  const { searchTerm, setSearchTerm, filteredROs } = useRepairOrderSearch();
  const { currentRO, pendingROImages, setPendingROImages } = useActiveRepairOrder();
  const currentLine = useActiveLine();
  const { storyQuality, storyReview, storyQualityStale } = useLineAuditState(
    currentLine?.id,
    currentLine?.warrantyStory
  );

  switch (view) {
    case 'home':
      return (
        <HomeView
          filteredROs={filteredROs}
          searchTerm={searchTerm}
          pendingROImages={pendingROImages}
          isProcessingOCR={isProcessingOCR}
          ocrProgress={ocrProgress}
          onSearchChange={setSearchTerm}
          onAddROPhoto={repairOrderService.addROPhotoPicker}
          onCreateManualRO={() => void repairOrderService.createManualRO()}
          onClearPending={() => setPendingROImages([])}
          onRemovePending={(idx) => setPendingROImages((prev) => prev.filter((_, i) => i !== idx))}
          onProcessPending={() => void repairOrderService.processPendingROImages()}
          onOpenRO={repairOrderService.openRepairOrder}
          onDeleteRO={(id) => void repairOrderService.deleteRepairOrder(id)}
          onOpenSettings={() => repairOrderService.navigateTo('settings')}
        />
      );

    case 'ro':
      if (!currentRO) return null;
      return (
        <ROView
          ro={currentRO}
          isProcessingOCR={isProcessingOCR}
          ocrProgress={ocrProgress}
          onDone={() => repairOrderService.navigateTo('home')}
          onUpdateRONumber={repairOrderService.updateRONumber}
          onUpdateVehicle={(field, value) => repairOrderService.updateVehicle({ [field]: value })}
          onUpdateCustomer={repairOrderService.updateCustomer}
          onAddComplaint={repairOrderService.addComplaint}
          onEditComplaint={repairOrderService.editComplaint}
          onRemoveComplaint={repairOrderService.removeComplaint}
          onAddROXentryPhotos={repairOrderService.addROXentryPhotos}
          onAddRepairLine={repairOrderService.addRepairLine}
          onOpenLine={(lineId) => repairOrderService.navigateTo('line', lineId)}
          onDeleteRO={() => void repairOrderService.deleteRepairOrder(currentRO.id)}
        />
      );

    case 'line':
      if (!currentRO || !currentLine) return null;
      return (
        <LineView
          ro={currentRO}
          line={currentLine}
          isProcessingOCR={isProcessingOCR}
          ocrProgress={ocrProgress}
          isGenerating={isGenerating}
          isReviewing={isReviewing}
          hasApiKey={hasApiKey}
          storyQuality={storyQuality}
          storyReview={storyReview}
          storyQualityStale={storyQualityStale}
          onBack={() => repairOrderService.navigateTo('ro')}
          onUpdateLine={(updates) => repairOrderService.updateLine(currentLine.id, updates)}
          onAddXentryPhotos={() => repairOrderService.addXentryPhotos(currentLine.id)}
          onApplySmartDefaults={() => repairOrderService.applySmartDefaultsToLine(currentLine.id)}
          onGenerateStory={() => {
            if (requireApiKey()) void repairOrderService.generateStoryForLine(currentLine.id);
          }}
          onReviewStory={() => {
            if (requireApiKey()) void repairOrderService.reviewStoryForLine(currentLine.id);
          }}
        />
      );

    case 'settings':
      return (
        <SettingsView onBack={() => repairOrderService.navigateTo(currentRO ? 'ro' : 'home')} />
      );

    default:
      return null;
  }
}