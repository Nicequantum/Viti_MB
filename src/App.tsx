import { Toaster } from 'sonner';
import { AppBootstrap } from './components/layout/AppBootstrap';
import { AppHeader } from './components/layout/AppHeader';
import { AppRoutes } from './components/layout/AppRoutes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { useAppChrome } from './hooks/useAppChrome';
import { useAppInit } from './hooks/useAppInit';
import { useRepairOrderActions } from './hooks/useRepairOrderActions';

function App() {
  const hydrated = useAppInit();
  const { view, showHeader, loadingOverlay } = useAppChrome();
  const { home } = useRepairOrderActions();

  if (!hydrated) {
    return <AppBootstrap />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Toaster theme="dark" position="top-center" richColors closeButton />

        {showHeader && <AppHeader onOpenSettings={home.openSettings} />}

        <AppRoutes view={view} />

        <LoadingOverlay {...loadingOverlay} />
      </div>
    </ErrorBoundary>
  );
}

export default App;