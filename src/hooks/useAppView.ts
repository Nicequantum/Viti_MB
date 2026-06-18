import { useAppStore } from '../store/appStore';

export function useAppView() {
  const view = useAppStore((s) => s.view);
  const showHeader = view !== 'home' && view !== 'settings';

  return { view, showHeader };
}