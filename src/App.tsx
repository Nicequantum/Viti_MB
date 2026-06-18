import { Toaster } from 'sonner';
import { AppBootstrap } from './components/layout/AppBootstrap';
import { AppHeader } from './components/layout/AppHeader';
import { AppRoutes } from './components/layout/AppRoutes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { useAppInit } from './hooks/useAppInit';
import { useAppView } from './hooks/useAppView';
import { useLoadingState } from './hooks/useLoadingState';
import { navigateTo } from './services/repair-order.service';

function App() {
  const hydrated = useAppInit();
  const { view, showHeader } = useAppView();
  const { overlay } = useLoadingState();

  if (!hydrated) {
    return <AppBootstrap />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Toaster theme="dark" position="top-center" richColors closeButton />

        {showHeader && <AppHeader onOpenSettings={() => navigateTo('settings')} />}

        <AppRoutes view={view} />

        <LoadingOverlay {...overlay} />
      </div>
    </ErrorBoundary>
  );
}

export default App;