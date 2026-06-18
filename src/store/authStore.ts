import { create } from 'zustand';
import {
  clearStoredKeys,
  hasStoredEncryptedKey,
  loadEncryptedKey,
  PLAIN_KEY_STORAGE,
  saveEncryptedKey,
  savePlainKeyLegacy,
} from '../lib/apiKey';
import { writeAuditLog } from '../lib/audit';
import { logger } from '../lib/logger';

interface AuthState {
  apiKey: string;
  passphrase: string;
  hasEncryptedKey: boolean;
  isUnlocked: boolean;
  dealershipId: string;
  dealershipName: string;
  setApiKey: (key: string) => void;
  setPassphrase: (passphrase: string) => void;
  initialize: () => void;
  unlock: () => Promise<boolean>;
  saveKey: () => Promise<void>;
  clearKeys: () => void;
  hasValidKey: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  apiKey: '',
  passphrase: '',
  hasEncryptedKey: false,
  isUnlocked: false,
  dealershipId: 'local-dealership',
  dealershipName: 'Mercedes-Benz Service',

  setApiKey: (apiKey) => set({ apiKey }),
  setPassphrase: (passphrase) => set({ passphrase }),

  initialize: () => {
    const hasEncryptedKey = hasStoredEncryptedKey();
    const legacy = localStorage.getItem(PLAIN_KEY_STORAGE);
    if (legacy && !hasEncryptedKey) {
      set({ apiKey: legacy, isUnlocked: true, hasEncryptedKey: false });
    } else {
      set({ hasEncryptedKey });
    }
    logger.info('Auth store initialized', 'auth');
  },

  unlock: async () => {
    const { passphrase } = get();
    const key = await loadEncryptedKey(passphrase);
    if (key) {
      set({ apiKey: key, isUnlocked: true, passphrase: '' });
      writeAuditLog('auth.unlock', { dealershipId: get().dealershipId });
      return true;
    }
    return false;
  },

  saveKey: async () => {
    const { apiKey, passphrase } = get();
    if (passphrase && apiKey) {
      await saveEncryptedKey(apiKey, passphrase);
      set({ hasEncryptedKey: true, isUnlocked: true, passphrase: '' });
    } else if (apiKey) {
      savePlainKeyLegacy(apiKey);
      set({ hasEncryptedKey: false });
    } else {
      await saveEncryptedKey('', '');
      set({ hasEncryptedKey: false, isUnlocked: false });
    }
    writeAuditLog('auth.save_key', { dealershipId: get().dealershipId });
  },

  clearKeys: () => {
    clearStoredKeys();
    set({ apiKey: '', hasEncryptedKey: false, isUnlocked: false, passphrase: '' });
  },

  hasValidKey: () => {
    const { apiKey, hasEncryptedKey, isUnlocked } = get();
    return !!apiKey || (hasEncryptedKey && isUnlocked);
  },
}));