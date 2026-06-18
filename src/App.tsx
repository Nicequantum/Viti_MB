import { Toaster } from 'sonner';
import { AppHeader } from './components/layout/AppHeader';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { SettingsView } from './features/auth/SettingsView';
import { LineView } from './features/lines/LineView';
import { HomeView } from './features/repair-orders/HomeView';
import { ROView } from './features/repair-orders/ROView';
import { useAppInit } from './hooks/useAppInit';
import { useRequireApiKey } from './hooks/useRequireApiKey';
import {
  addComplaint,
  addRepairLine,
  addROPhotoPicker,
  addROXentryPhotos,
  addXentryPhotos,
  applySmartDefaultsToLine,
  createManualRO,
  deleteRepairOrder,
  editComplaint,
  generateStoryForLine,
  navigateTo,
  openRepairOrder,
  processPendingROImages,
  removeComplaint,
  reviewStoryForLine,
  updateCustomer,
  updateLine,
  updateRONumber,
  updateVehicle,
} from './services/repair-order.service';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';
import { useBenzBotStore } from './store/benzbotStore';
import { useRepairOrderStore } from './store/repairOrderStore';

function App() {
  const hydrated = useAppInit();
  const requireApiKey = useRequireApiKey();

  const view = useAppStore((s) => s.view);
  const searchTerm = useAppStore((s) => s.searchTerm);
  const setSearchTerm = useAppStore((s) => s.setSearchTerm);
  const isProcessingOCR = useAppStore((s) => s.isProcessingOCR);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const isReviewing = useAppStore((s) => s.isReviewing);
  const ocrProgress = useAppStore((s) => s.ocrProgress);
  const loadingMessage = useAppStore((s) => s.loadingMessage);

  const currentRO = useRepairOrderStore((s) => s.currentRO);
  const currentLineId = useRepairOrderStore((s) => s.currentLineId);
  const pendingROImages = useRepairOrderStore((s) => s.pendingROImages);
  const setPendingROImages = useRepairOrderStore((s) => s.setPendingROImages);
  const getFilteredROs = useRepairOrderStore((s) => s.getFilteredROs);

  const apiKey = useAuthStore((s) => s.apiKey);

  const currentLine = useRepairOrderStore((s) =>
    s.currentLineId ? s.currentRO?.repairLines.find((l) => l.id === s.currentLineId) : undefined
  );
  const storyText = currentLine?.warrantyStory;

  const storyQuality = useBenzBotStore((s) =>
    currentLineId ? s.getQualityForLine(currentLineId, storyText) : null
  );
  const storyReview = useBenzBotStore((s) => (currentLineId ? s.getReviewForLine(currentLineId) : null));
  const storyQualityStale = useBenzBotStore((s) =>
    currentLineId ? s.isStaleForLine(currentLineId, storyText) : false
  );
  const showLoading = isProcessingOCR || isGenerating || isReviewing;

  if (!hydrated) {
    return (
      <div className="app-container flex items-center justify-center min-h-dvh">
        <div className="text-[#8e8e93] text-sm">Loading Benz Tech…</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Toaster theme="dark" position="top-center" richColors closeButton />

        {view !== 'home' && view !== 'settings' && (
          <AppHeader onOpenSettings={() => navigateTo('settings')} />
        )}

        {view === 'home' && (
          <HomeView
            filteredROs={getFilteredROs(searchTerm)}
            searchTerm={searchTerm}
            pendingROImages={pendingROImages}
            isProcessingOCR={isProcessingOCR}
            ocrProgress={ocrProgress}
            onSearchChange={setSearchTerm}
            onAddROPhoto={addROPhotoPicker}
            onCreateManualRO={() => void createManualRO()}
            onClearPending={() => setPendingROImages([])}
            onRemovePending={(idx) => setPendingROImages((prev) => prev.filter((_, i) => i !== idx))}
            onProcessPending={() => void processPendingROImages()}
            onOpenRO={openRepairOrder}
            onDeleteRO={(id) => void deleteRepairOrder(id)}
            onOpenSettings={() => navigateTo('settings')}
          />
        )}

        {view === 'ro' && currentRO && (
          <ROView
            ro={currentRO}
            isProcessingOCR={isProcessingOCR}
            ocrProgress={ocrProgress}
            onDone={() => navigateTo('home')}
            onUpdateRONumber={updateRONumber}
            onUpdateVehicle={(field, value) => updateVehicle({ [field]: value })}
            onUpdateCustomer={updateCustomer}
            onAddComplaint={addComplaint}
            onEditComplaint={editComplaint}
            onRemoveComplaint={removeComplaint}
            onAddROXentryPhotos={addROXentryPhotos}
            onAddRepairLine={addRepairLine}
            onOpenLine={(lineId) => navigateTo('line', lineId)}
            onDeleteRO={() => void deleteRepairOrder(currentRO.id)}
          />
        )}

        {view === 'line' && currentRO && currentLine && (
          <LineView
            ro={currentRO}
            line={currentLine}
            isProcessingOCR={isProcessingOCR}
            ocrProgress={ocrProgress}
            isGenerating={isGenerating}
            isReviewing={isReviewing}
            hasApiKey={!!apiKey}
            storyQuality={storyQuality}
            storyReview={storyReview}
            storyQualityStale={storyQualityStale}
            onBack={() => navigateTo('ro')}
            onUpdateLine={(updates) => updateLine(currentLine.id, updates)}
            onAddXentryPhotos={() => addXentryPhotos(currentLine.id)}
            onApplySmartDefaults={() => applySmartDefaultsToLine(currentLine.id)}
            onGenerateStory={() => {
              if (requireApiKey()) void generateStoryForLine(currentLine.id);
            }}
            onReviewStory={() => {
              if (requireApiKey()) void reviewStoryForLine(currentLine.id);
            }}
          />
        )}

        {view === 'settings' && <SettingsView onBack={() => navigateTo(currentRO ? 'ro' : 'home')} />}

        <LoadingOverlay
          visible={showLoading}
          message={loadingMessage || (isGenerating ? 'Generating with Grok…' : 'Processing…')}
          progress={isProcessingOCR ? ocrProgress : undefined}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;