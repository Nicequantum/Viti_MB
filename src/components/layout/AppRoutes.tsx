import { SettingsView } from '../../features/auth/SettingsView';
import { LineView } from '../../features/lines/LineView';
import { HomeView } from '../../features/repair-orders/HomeView';
import { ROView } from '../../features/repair-orders/ROView';
import { useAppChrome } from '../../hooks/useAppChrome';
import { useCurrentLineState } from '../../hooks/useCurrentLineState';
import { useRepairOrderActions } from '../../hooks/useRepairOrderActions';
import { useRepairOrderSelectors } from '../../hooks/useRepairOrderSelectors';
import { useRequireApiKey } from '../../hooks/useRequireApiKey';
import { useAuthStore } from '../../store/authStore';
import type { AppView } from '../../types';

interface AppRoutesProps {
  view: AppView;
}

export function AppRoutes({ view }: AppRoutesProps) {
  const requireApiKey = useRequireApiKey();
  const hasApiKey = useAuthStore((s) => !!s.apiKey);

  const { ocr, story } = useAppChrome();
  const { searchTerm, setSearchTerm, currentRO, pendingROImages, setPendingROImages, filteredROs } =
    useRepairOrderSelectors();
  const { currentLine, storyQuality, storyReview, storyQualityStale } = useCurrentLineState();
  const { home, ro, line, settings } = useRepairOrderActions();

  switch (view) {
    case 'home':
      return (
        <HomeView
          filteredROs={filteredROs}
          searchTerm={searchTerm}
          pendingROImages={pendingROImages}
          isProcessingOCR={ocr.isProcessingOCR}
          ocrProgress={ocr.ocrProgress}
          onSearchChange={setSearchTerm}
          onAddROPhoto={home.addROPhoto}
          onCreateManualRO={home.createManualRO}
          onClearPending={() => setPendingROImages([])}
          onRemovePending={(idx) => setPendingROImages((prev) => prev.filter((_, i) => i !== idx))}
          onProcessPending={home.processPending}
          onOpenRO={home.openRO}
          onDeleteRO={home.deleteRO}
          onOpenSettings={home.openSettings}
        />
      );

    case 'ro':
      if (!currentRO) return null;
      return (
        <ROView
          ro={currentRO}
          isProcessingOCR={ocr.isProcessingOCR}
          ocrProgress={ocr.ocrProgress}
          onDone={ro.done}
          onUpdateRONumber={ro.updateRONumber}
          onUpdateVehicle={(field, value) => ro.updateVehicle({ [field]: value })}
          onUpdateCustomer={ro.updateCustomer}
          onAddComplaint={ro.addComplaint}
          onEditComplaint={ro.editComplaint}
          onRemoveComplaint={ro.removeComplaint}
          onAddROXentryPhotos={ro.addROXentryPhotos}
          onAddRepairLine={ro.addRepairLine}
          onOpenLine={ro.openLine}
          onDeleteRO={() => ro.deleteRO(currentRO.id)}
        />
      );

    case 'line':
      if (!currentRO || !currentLine) return null;
      return (
        <LineView
          ro={currentRO}
          line={currentLine}
          isProcessingOCR={ocr.isProcessingOCR}
          ocrProgress={ocr.ocrProgress}
          isGenerating={story.isGenerating}
          isReviewing={story.isReviewing}
          hasApiKey={hasApiKey}
          storyQuality={storyQuality}
          storyReview={storyReview}
          storyQualityStale={storyQualityStale}
          onBack={line.back}
          onUpdateLine={(updates) => line.updateLine(currentLine.id, updates)}
          onAddXentryPhotos={() => line.addXentryPhotos(currentLine.id)}
          onApplySmartDefaults={() => line.applySmartDefaults(currentLine.id)}
          onGenerateStory={() => {
            if (requireApiKey()) line.generateStory(currentLine.id);
          }}
          onReviewStory={() => {
            if (requireApiKey()) line.reviewStory(currentLine.id);
          }}
        />
      );

    case 'settings':
      return <SettingsView onBack={() => settings.back(!!currentRO)} />;

    default:
      return null;
  }
}