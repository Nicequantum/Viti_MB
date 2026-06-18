import { toast } from 'sonner';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

export function useRequireApiKey(): () => boolean {
  const setView = useAppStore((s) => s.setView);
  const apiKey = useAuthStore((s) => s.apiKey);
  const hasEncryptedKey = useAuthStore((s) => s.hasEncryptedKey);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);

  return () => {
    if (apiKey) return true;
    if (hasEncryptedKey && !isUnlocked) {
      toast.error('Unlock your encrypted xAI key in Settings using your passphrase.');
      setView('settings');
      return false;
    }
    toast.error('Please enter / unlock your xAI Grok API key in Settings.');
    setView('settings');
    return false;
  };
}