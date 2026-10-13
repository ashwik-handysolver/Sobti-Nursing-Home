import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { LanguageMode } from '../../types/meeting';
import { apiKeyHeaders, getUserApiKey, setUserApiKey } from '../../utils/apiKey';
import { Button, Card, muted, PageHeader, sectionTitle, SegmentedControl, Switch, TextInput } from '../ui';

interface SettingsViewProps {
  defaultLanguage: LanguageMode;
  onUpdateDefaultLanguage: (lang: LanguageMode) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetToClinicalData?: () => void;
}

const LANGUAGES: { id: LanguageMode; label: string }[] = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
];

type KeyCheck = { state: 'idle' | 'checking' | 'ok' | 'error'; message?: string };

const maskKey = (key: string) => `••••••••${key.slice(-4)}`;

export const SettingsView: React.FC<SettingsViewProps> = ({
  defaultLanguage,
  onUpdateDefaultLanguage,
  isDarkMode,
  onToggleDarkMode,
  onResetToClinicalData,
}) => {
  const [resetDone, setResetDone] = useState(false);
  const [savedKey, setSavedKey] = useState(getUserApiKey);
  const [keyInput, setKeyInput] = useState('');
  const [serverHasKey, setServerHasKey] = useState<boolean | null>(null);
  const [keyCheck, setKeyCheck] = useState<KeyCheck>({ state: 'idle' });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setServerHasKey(Boolean(data.hasGeminiKey)))
      .catch(() => setServerHasKey(false));
  }, []);

  // Asks the server to make one tiny call to Gemini with whichever key is in effect
  const testKey = async () => {
    setKeyCheck({ state: 'checking' });
    try {
      const res = await fetch('/api/test-key', { method: 'POST', headers: apiKeyHeaders() });
      const data = await res.json().catch(() => ({}));
      setKeyCheck(
        res.ok && data.ok
          ? { state: 'ok', message: 'Key works' }
          : { state: 'error', message: data.error || 'The key could not be verified.' }
      );
    } catch {
      setKeyCheck({ state: 'error', message: 'Server not reachable.' });
    }
  };

  const saveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key) return;
    setUserApiKey(key);
    setSavedKey(key);
    setKeyInput('');
    testKey();
  };

  const removeKey = () => {
    setUserApiKey('');
    setSavedKey('');
    setKeyCheck({ state: 'idle' });
  };

  const handleResetData = () => {
    if (!onResetToClinicalData) return;
    if (!confirm('Replace all recordings and patients with the sample data?')) return;
    onResetToClinicalData();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const row = 'flex items-center justify-between gap-4 px-5 py-4';
  const keyInEffect = savedKey ? 'yours' : serverHasKey ? 'server' : 'none';

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Settings" />

      {/* Gemini API key */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className={sectionTitle}>Gemini API key</span>
          {serverHasKey === null ? (
            <span className={muted}>Checking…</span>
          ) : keyInEffect === 'none' ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              No key set
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {keyInEffect === 'yours' ? 'Using your key' : "Using the server's key"}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Recordings are analyzed with Google Gemini. Add your own key to use your own account
          {serverHasKey ? '; otherwise the key configured on the server is used.' : '.'}
        </p>

        {savedKey ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200">
              {maskKey(savedKey)}
            </code>
            <Button variant="outline" onClick={testKey} disabled={keyCheck.state === 'checking'}>
              Test
            </Button>
            <Button variant="ghost" onClick={removeKey} className="hover:text-rose-600 dark:hover:text-rose-400">
              Remove
            </Button>
          </div>
        ) : (
          <form onSubmit={saveKey} className="flex flex-col sm:flex-row gap-2">
            <TextInput
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your Gemini API key"
              aria-label="Gemini API key"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" disabled={!keyInput.trim()} className="shrink-0">
              Save key
            </Button>
            {serverHasKey && (
              <Button
                variant="outline"
                type="button"
                onClick={testKey}
                disabled={keyCheck.state === 'checking'}
                className="shrink-0"
              >
                Test server key
              </Button>
            )}
          </form>
        )}

        {keyCheck.state !== 'idle' && (
          <p
            role="status"
            className={`inline-flex items-center gap-1.5 text-sm ${
              keyCheck.state === 'error' ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {keyCheck.state === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
            {keyCheck.state === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            {keyCheck.state === 'error' && <AlertCircle className="w-4 h-4" />}
            {keyCheck.state === 'checking' ? 'Checking the key…' : keyCheck.message}
          </p>
        )}

        <p className={muted}>
          Your key is stored in this browser only and is sent to this app's server with each analysis. Get one at
          aistudio.google.com/apikey.
        </p>
      </Card>

      <Card className="divide-y divide-gray-100 dark:divide-gray-700/60">
        <div className={row}>
          <span className={sectionTitle}>Default language</span>
          <SegmentedControl<LanguageMode> value={defaultLanguage} onChange={onUpdateDefaultLanguage} options={LANGUAGES} />
        </div>

        <div className={row}>
          <span className={sectionTitle}>Dark mode</span>
          <Switch checked={isDarkMode} onChange={onToggleDarkMode} aria-label="Dark mode" />
        </div>

        <div className={row}>
          <span className={sectionTitle}>Sample data</span>
          {resetDone ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Restored
            </span>
          ) : (
            <Button variant="outline" onClick={handleResetData}>
              Reset to sample data
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
