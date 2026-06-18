import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { StableInput } from '../../components/ui/StableTextField';
import { useAuthStore } from '../../store/authStore';

interface SettingsViewProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const apiKey = useAuthStore((s) => s.apiKey);
  const passphrase = useAuthStore((s) => s.passphrase);
  const hasEncryptedKey = useAuthStore((s) => s.hasEncryptedKey);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const dealershipName = useAuthStore((s) => s.dealershipName);
  const setApiKey = useAuthStore((s) => s.setApiKey);
  const setPassphrase = useAuthStore((s) => s.setPassphrase);
  const unlock = useAuthStore((s) => s.unlock);
  const saveKey = useAuthStore((s) => s.saveKey);
  const clearKeys = useAuthStore((s) => s.clearKeys);

  const handleUnlock = async () => {
    const ok = await unlock();
    if (ok) toast.success('API key unlocked for this session');
    else toast.error('Unlock failed. Check passphrase.');
  };

  const handleSave = async () => {
    await saveKey();
    if (apiKey) toast.success('API key saved');
    else toast.success('API key cleared');
  };

  const handleClear = () => {
    clearKeys();
    toast.success('All keys cleared');
  };

  return (
    <div className="px-5 pt-6">
      <button onClick={onBack} className="flex items-center text-[#0a84ff] mb-6">
        <ArrowLeft size={18} className="mr-1" /> Back
      </button>

      <h2 className="text-2xl font-semibold mb-2">Settings</h2>
      <p className="text-xs text-[#8e8e93] mb-6">{dealershipName} • Enterprise Warranty Assistant</p>

      <div className="ios-card p-5 mb-6">
        <div className="font-semibold mb-1">xAI Grok API Key (encrypted storage)</div>
        <div className="text-[10px] text-[#8e8e93] mb-3">
          Key never stored in plain text. Uses AES-GCM encryption with your passphrase.
        </div>

        {hasEncryptedKey && !isUnlocked && (
          <div className="mb-4 p-3 bg-[#2c2c2e] rounded-xl">
            <div className="text-sm mb-2">Encrypted key detected. Enter passphrase to unlock for this session:</div>
            <StableInput
              fieldKey="settings-unlock-passphrase"
              type="password"
              value={passphrase}
              onChange={setPassphrase}
              showVoice={false}
              placeholder="Your encryption passphrase"
              className="w-full bg-[#1c1c1e] border border-[#38383a] rounded-xl p-3 text-sm mb-2"
            />
            <button onClick={() => void handleUnlock()} className="primary-btn w-full h-10 text-sm">
              UNLOCK KEY
            </button>
          </div>
        )}

        <div>
          <label className="text-xs text-[#8e8e93] mb-1 block">API KEY (xai-...)</label>
          <StableInput
            fieldKey="settings-api-key"
            type="password"
            value={apiKey}
            onChange={setApiKey}
            showVoice={false}
            placeholder="xai-yourkeyhere"
            className="w-full bg-[#2c2c2e] border border-[#444] rounded-xl p-3.5 font-mono text-sm mb-3"
          />
        </div>

        <div>
          <label className="text-xs text-[#8e8e93] mb-1 block">PASSPHRASE (for encryption — remember this!)</label>
          <StableInput
            fieldKey="settings-passphrase"
            type="password"
            value={passphrase}
            onChange={setPassphrase}
            showVoice={false}
            placeholder="Strong passphrase to encrypt key"
            className="w-full bg-[#2c2c2e] border border-[#444] rounded-xl p-3.5 text-sm mb-3"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => void handleSave()} className="flex-1 secondary-btn h-11">
            SAVE ENCRYPTED KEY
          </button>
          <button onClick={handleClear} className="secondary-btn h-11 px-6 text-[#ff9f0a]">
            CLEAR ALL
          </button>
        </div>

        <p className="text-xs text-[#8e8e93] mt-3 leading-snug">
          Get key at console.x.ai. Encrypted with passphrase using Web Crypto (AES-GCM + 150k PBKDF2).
        </p>
        {isUnlocked && <div className="text-[10px] text-[#30d158] mt-2">✓ Key unlocked in memory for this session.</div>}
      </div>

      <div className="text-xs text-[#8e8e93] px-1 leading-relaxed">
        BenzBot 2.0 audit-resistant warranty stories • Natural paragraph format • Customer Pay exact-text templates
      </div>
    </div>
  );
}