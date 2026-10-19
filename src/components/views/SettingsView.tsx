import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, BellRing, Loader2 } from 'lucide-react';
import { LanguageMode } from '../../types/meeting';
import { PushStatus, disablePush, enablePush, getPushStatus, sendTestPush } from '../../utils/push';
import { Button, Card, muted, PageHeader, sectionTitle, SegmentedControl, Switch, TextInput } from '../ui';

interface SettingsViewProps {
  defaultLanguage: LanguageMode;
  onUpdateDefaultLanguage: (lang: LanguageMode) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const LANGUAGES: { id: LanguageMode; label: string }[] = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
];

type KeyCheck = { state: 'idle' | 'checking' | 'ok' | 'error'; message?: string };

export const SettingsView: React.FC<SettingsViewProps> = ({
  defaultLanguage,
  onUpdateDefaultLanguage,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [serverHasKey, setServerHasKey] = useState<boolean | null>(null);
  const [keyCheck, setKeyCheck] = useState<KeyCheck>({ state: 'idle' });
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getPushStatus().then(setPushStatus).catch(() => setPushStatus('unsupported'));
  }, []);

  const runPush = async (action: () => Promise<string | void>) => {
    setPushBusy(true);
    setPushMessage(null);
    try {
      const text = await action();
      if (text) setPushMessage({ ok: true, text });
    } catch (err: any) {
      setPushMessage({ ok: false, text: err?.message || 'Something went wrong.' });
    } finally {
      setPushStatus(await getPushStatus().catch(() => 'unsupported' as const));
      setPushBusy(false);
    }
  };

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
      const res = await fetch('/api/test-key', { method: 'POST' });
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

  const row = 'flex items-center justify-between gap-4 px-5 py-4';

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title="Settings" />

      {/* Gemini API key */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className={sectionTitle}>Gemini API key</span>
          {serverHasKey === null ? (
            <span className={muted}>Checking…</span>
          ) : !serverHasKey ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              No key set
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Configured on the server
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          {serverHasKey
            ? 'Recordings are analyzed with Google Gemini using the key in the server’s .env.local file.'
            : 'Add GEMINI_API_KEY to the .env.local file on the server, then restart the app.'}
        </p>

        {serverHasKey && (
          <Button variant="outline" onClick={testKey} disabled={keyCheck.state === 'checking'}>
            Test the key
          </Button>
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
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className={`${sectionTitle} inline-flex items-center gap-2`}>
            <BellRing className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Follow-up reminders
          </span>
          {pushStatus === 'on' || pushStatus === 'off' ? (
            <Switch
              checked={pushStatus === 'on'}
              onChange={() => runPush(pushStatus === 'on' ? disablePush : enablePush)}
              aria-label="Follow-up reminders"
            />
          ) : null}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {pushStatus === 'unsupported'
            ? "This browser can't show notifications."
            : pushStatus === 'denied'
            ? 'Notifications are blocked for this site. Allow them in your browser settings, then reload.'
            : 'Get a notification on this device each morning at 9:00 AM when follow-ups are due or overdue.'}
        </p>
        {pushStatus === 'on' && (
          <Button variant="outline" disabled={pushBusy} onClick={() => runPush(sendTestPush)}>
            Send a test notification
          </Button>
        )}
        {(pushBusy || pushMessage) && (
          <p
            role="status"
            className={`inline-flex items-center gap-1.5 text-sm ${
              pushMessage && !pushMessage.ok ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {pushBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : pushMessage?.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {pushBusy ? 'Working…' : pushMessage?.text}
          </p>
        )}
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
      </Card>
    </div>
  );
};
