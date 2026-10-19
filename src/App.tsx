/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { MeetingRecording, MeetingTask, LanguageMode, ClientLead } from './types/meeting';
import type { AppUser } from './AuthGate';
import { deleteLeads, fetchLeads, saveLeads } from './lib/leadsStore';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { PatientsView } from './components/views/PatientsView';
import { RecordingsListView } from './components/views/RecordingsListView';
import { FollowUpsView } from './components/views/FollowUpsView';
// Screens that are not needed on first load are fetched when opened
const MeetingDetailsView = lazy(() =>
  import('./components/views/MeetingDetailsView').then((m) => ({ default: m.MeetingDetailsView }))
);
const InsightsView = lazy(() => import('./components/views/InsightsView').then((m) => ({ default: m.InsightsView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then((m) => ({ default: m.SettingsView })));
import { TopNavbar } from './components/TopNavbar';
import { UploadDialog, UploadMode } from './components/UploadDialog';
import { Toast, ToastMessage } from './components/ui';
import { deleteRecordingAudio, loadRecordingAudio, saveRecordingAudio } from './utils/audioStore';
import { clearLegacyAudio, loadLegacyAudio } from './utils/legacyAudioStore';
import {
  deleteFollowUps,
  deleteRecordings,
  fetchRecordings,
  followUpEntries,
  followUpKey,
  recordingPayload,
  saveFollowUps,
  saveRecordings,
} from './lib/recordingsStore';
import { buildAnalysisFields, requestAnalysis } from './utils/analyzeRecording';
import { normalizeLead, withAnalysis } from './utils/leads';
import { notifyIfAway } from './utils/push';

const STORAGE_KEY_RECORDINGS = 'meetmind_eyecare_recordings_v4';
const STORAGE_KEY_CLIENTS = 'meetmind_eyecare_clients_v4';
// v2: earlier versions saved the theme on every visit, so v1 does not tell us what anyone chose
const STORAGE_KEY_THEME = 'meetmind_theme_v2';
const STORAGE_KEY_LANG = 'meetmind_default_lang_v1';
const STORAGE_KEY_SIDEBAR = 'meetmind_sidebar_collapsed_v1';

const TOAST_MS = 6000;

const PAGE_TITLES: Record<NavigationPage, string> = {
  dashboard: 'Dashboard',
  recordings: 'Recordings',
  patients: 'Leads',
  insights: 'Conversion Insights',
  'follow-ups': 'Follow-ups',
  settings: 'Settings',
};

// Remove legacy pre-ophthalmology caches
try {
  localStorage.removeItem('meetmind_recordings_v1');
  localStorage.removeItem('meetmind_clients_v1');
} catch {}

const isOphthalmicRecording = (r: any): boolean => {
  if (!r || typeof r !== 'object') return false;
  const title = (r.title || '').toLowerCase();
  const summary = (r.summary?.executiveSummary || '').toLowerCase();
  if (title.includes('sprint') || title.includes('upi') || title.includes('redis') || title.includes('saas')) {
    return false;
  }
  return Boolean(
    r.clientId ||
    r.consultationType ||
    title.includes('cataract') ||
    title.includes('lasik') ||
    title.includes('glaucoma') ||
    title.includes('retina') ||
    summary.includes('eye') ||
    summary.includes('cataract') ||
    summary.includes('vision')
  );
};

// Object URLs do not survive a page reload, so they are never persisted
const stripAudioUrls = (list: MeetingRecording[]) => list.map(({ audioUrl, ...rest }) => rest);

export default function App({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      // Day mode unless dark mode was switched on here
      return localStorage.getItem(STORAGE_KEY_THEME) === 'dark';
    } catch {
      return false;
    }
  });

  // Language default state
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_LANG) as LanguageMode) || 'auto';
    } catch {
      return 'auto';
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SIDEBAR) === '1';
    } catch {
      return false;
    }
  });

  // Patients / Client Leads state
  const [clients, setClients] = useState<ClientLead[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Recordings state
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);

  // Navigation state
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [transcriptSearchSeed, setTranscriptSearchSeed] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPatientIdForView, setSelectedPatientIdForView] = useState<string | null>(null);

  // Upload dialog
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [preSelectedClient, setPreSelectedClient] = useState<ClientLead | null>(null);
  const [openNewPatient, setOpenNewPatient] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  // Toast with optional undo
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Saves that failed while offline are retried when the connection returns
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  const toastTimerRef = useRef<number | null>(null);
  const pendingAudioDeletesRef = useRef<Record<string, number>>({});

  const dismissToast = () => {
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  const showToast = (message: string, undo?: () => void) => {
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, undo });
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  // Sync theme with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Recordings and their follow-ups live in Supabase: load them once (moving over anything an
  // earlier version saved in this browser), then mirror every change back
  const [recordingsLoaded, setRecordingsLoaded] = useState(false);
  const syncedRecordingsRef = useRef<Map<string, string>>(new Map());
  const syncedFollowUpsRef = useRef<Map<string, string>>(new Map());
  // Writes run one after another so a delete and a quick undo reach the database in order
  const recordingsSyncQueueRef = useRef<Promise<void>>(Promise.resolve());

  const markRecordingsSynced = (list: MeetingRecording[]) => {
    syncedRecordingsRef.current = new Map(list.map((r) => [r.id, JSON.stringify(recordingPayload(r))]));
    syncedFollowUpsRef.current = new Map(followUpEntries(list).map((e) => [e.task.id, followUpKey(e)]));
  };

  useEffect(() => {
    let cancelled = false;

    const readLegacyRecordings = (): MeetingRecording[] => {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_RECORDINGS) || '[]');
        return Array.isArray(parsed)
          ? parsed.filter((r: MeetingRecording) => r && r.id && !r.isDemo && !r.id.startsWith('rec-sample-'))
          : [];
      } catch {
        return [];
      }
    };

    (async () => {
      try {
        const fromDb = await fetchRecordings();
        const legacy = readLegacyRecordings().filter((r) => !fromDb.some((d) => d.id === r.id));

        const moved: MeetingRecording[] = [];
        if (legacy.length > 0) {
          for (const r of legacy) {
            const audio = await loadLegacyAudio(r.id);
            const audioPath = audio ? await saveRecordingAudio(r.id, audio) : undefined;
            moved.push({ ...r, audioPath, audioUrl: audio ? URL.createObjectURL(audio) : undefined });
          }
          await saveRecordings(moved);
          await saveFollowUps(followUpEntries(moved));
        }
        // The browser copy is only removed once the database has it
        try {
          localStorage.removeItem(STORAGE_KEY_RECORDINGS);
        } catch {}
        await clearLegacyAudio();

        if (cancelled) return;
        const all = [...moved, ...fromDb];
        markRecordingsSynced(all);
        setRecordings(all);
        setRecordingsLoaded(true);
        if (moved.length > 0) {
          showToast(`Moved ${moved.length} recording${moved.length === 1 ? '' : 's'} from this browser to the database`);
        }
      } catch (err: any) {
        console.error('Failed to load recordings:', err);
        if (!cancelled) setLeadsError(err?.message || 'Could not load recordings from the database.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!recordingsLoaded) return;
    const recSynced = syncedRecordingsRef.current;
    const fuSynced = syncedFollowUpsRef.current;

    const changedRecordings = recordings.filter((r) => recSynced.get(r.id) !== JSON.stringify(recordingPayload(r)));
    const removedRecordings = [...recSynced.keys()].filter((id) => !recordings.some((r) => r.id === id));
    const entries = followUpEntries(recordings);
    const changedFollowUps = entries.filter((e) => fuSynced.get(e.task.id) !== followUpKey(e));
    const removedFollowUps = [...fuSynced.keys()].filter((id) => !entries.some((e) => e.task.id === id));
    if (
      changedRecordings.length + removedRecordings.length + changedFollowUps.length + removedFollowUps.length ===
      0
    ) {
      return;
    }

    markRecordingsSynced(recordings);
    recordingsSyncQueueRef.current = recordingsSyncQueueRef.current.then(async () => {
      try {
        // A recording must exist before its follow-ups; deleting a recording also removes its follow-ups
        await saveRecordings(changedRecordings);
        await saveFollowUps(changedFollowUps);
        await deleteFollowUps(removedFollowUps);
        await deleteRecordings(removedRecordings);
      } catch (err: any) {
        console.error('Failed to save recordings:', err);
        // Forget what was sent so the next change retries it
        changedRecordings.forEach((r) => syncedRecordingsRef.current.delete(r.id));
        changedFollowUps.forEach((e) => syncedFollowUpsRef.current.delete(e.task.id));
        showToast(`Could not save to the database: ${err?.message || 'unknown error'}`);
      }
    });
  }, [recordings, recordingsLoaded, isOnline]);

  // Leads live in Supabase: load them once, then mirror every change back
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const syncedLeadsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    // Patient details used to be kept in this browser; the database is now the only copy
    try {
      localStorage.removeItem(STORAGE_KEY_CLIENTS);
    } catch {}
    fetchLeads()
      .then((leads) => {
        if (cancelled) return;
        syncedLeadsRef.current = new Map(leads.map((l) => [l.id, JSON.stringify(l)]));
        setClients(leads);
        setLeadsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load leads:', err);
        if (!cancelled) setLeadsError(err?.message || 'Could not load patients from the database.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!leadsLoaded) return;
    const synced = syncedLeadsRef.current;
    const changed = clients.filter((c) => synced.get(c.id) !== JSON.stringify(c));
    const removed = [...synced.keys()].filter((id) => !clients.some((c) => c.id === id));
    if (changed.length === 0 && removed.length === 0) return;

    syncedLeadsRef.current = new Map(clients.map((c) => [c.id, JSON.stringify(c)]));
    Promise.all([saveLeads(changed), deleteLeads(removed)]).catch((err) => {
      console.error('Failed to save leads:', err);
      // Forget what was sent so the next change retries it
      changed.forEach((c) => synced.delete(c.id));
      showToast(`Could not save to the database: ${err?.message || 'unknown error'}`);
    });
  }, [clients, leadsLoaded, isOnline]);

  // Only an explicit switch is remembered
  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY_THEME, prev ? 'light' : 'dark');
      } catch {}
      return !prev;
    });
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY_SIDEBAR, prev ? '0' : '1');
      } catch {}
      return !prev;
    });
  };

  const handleUpdateDefaultLanguage = (lang: LanguageMode) => {
    setDefaultLanguage(lang);
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  };

  // Recordings are always uploaded for a specific patient
  const [uploadMode, setUploadMode] = useState<UploadMode>('upload');
  const openUpload = (client: ClientLead, mode: UploadMode = 'upload') => {
    setPreSelectedClient(client);
    setUploadMode(mode);
    setIsUploadOpen(true);
  };

  const startNewPatient = () => {
    setSelectedRecordingId(null);
    setSelectedPatientIdForView(null);
    setOpenNewPatient(true);
    setActivePage('patients');
  };

  const closeUpload = () => {
    setIsUploadOpen(false);
    setPreSelectedClient(null);
  };

  const navigateTo = (page: NavigationPage) => {
    setSelectedRecordingId(null);
    setSelectedPatientIdForView(null);
    setActivePage(page);
  };

  // Links such as a reminder notification open a page with ?page=follow-ups
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page && page in PAGE_TITLES) {
      setActivePage(page as NavigationPage);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSelectRecording = (recordingId: string, transcriptQuery = '') => {
    setTranscriptSearchSeed(transcriptQuery);
    setSelectedRecordingId(recordingId);
    setActivePage('recordings');
  };

  const handleOpenPatient = (patientId: string) => {
    setSelectedRecordingId(null);
    setSelectedPatientIdForView(patientId);
    setActivePage('patients');
  };

  const handleProcessingSuccess = (newRecording: MeetingRecording) => {
    setRecordings((prev) => [newRecording, ...prev]);
    notifyIfAway('Analysis ready', newRecording.title, `/?recording=${encodeURIComponent(newRecording.id)}`);

    // The lead picks up the new recording along with its estimate, concerns and next step
    if (newRecording.clientId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === newRecording.clientId
            ? {
                ...withAnalysis(c, newRecording),
                recordingIds: c.recordingIds.includes(newRecording.id)
                  ? c.recordingIds
                  : [newRecording.id, ...c.recordingIds],
                lastVisitDate: newRecording.uploadDate.substring(0, 10),
              }
            : c
        )
      );
    }

    closeUpload();
    handleSelectRecording(newRecording.id);
  };

  const handleDeleteRecording = (recordingId: string) => {
    const index = recordings.findIndex((r) => r.id === recordingId);
    if (index < 0) return;
    const target = recordings[index];
    const linkedClientIds = clients.filter((c) => c.recordingIds.includes(recordingId)).map((c) => c.id);

    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        recordingIds: c.recordingIds.filter((id) => id !== recordingId),
      }))
    );
    if (selectedRecordingId === recordingId) {
      setSelectedRecordingId(null);
    }

    // The stored audio is only removed once the undo window has passed
    if (!target.isDemo) {
      pendingAudioDeletesRef.current[recordingId] = window.setTimeout(() => {
        if (target.audioUrl) URL.revokeObjectURL(target.audioUrl);
        deleteRecordingAudio(recordingId);
        delete pendingAudioDeletesRef.current[recordingId];
      }, TOAST_MS + 1000);
    }

    showToast('Recording deleted', () => {
      clearTimeout(pendingAudioDeletesRef.current[recordingId]);
      delete pendingAudioDeletesRef.current[recordingId];
      setRecordings((prev) => {
        if (prev.some((r) => r.id === recordingId)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, target);
        return next;
      });
      setClients((prev) =>
        prev.map((c) =>
          linkedClientIds.includes(c.id) && !c.recordingIds.includes(recordingId)
            ? { ...c, recordingIds: [...c.recordingIds, recordingId] }
            : c
        )
      );
    });
  };

  const handleUpdateRecordingTasks = (recordingId: string, updatedTasks: MeetingTask[]) => {
    const previous = recordings.find((r) => r.id === recordingId)?.tasks;
    setRecordings((prev) =>
      prev.map((r) => (r.id === recordingId ? { ...r, tasks: updatedTasks } : r))
    );
    if (!previous) return;

    const restore = () =>
      setRecordings((prev) => prev.map((r) => (r.id === recordingId ? { ...r, tasks: previous } : r)));
    if (updatedTasks.length < previous.length) {
      showToast('Follow-up deleted', restore);
    } else if (updatedTasks.length > previous.length) {
      showToast('Follow-up added', restore);
    } else if (updatedTasks.some((t, i) => t.description !== previous[i]?.description || t.priority !== previous[i]?.priority || t.owner !== previous[i]?.owner || t.dueDateISO !== previous[i]?.dueDateISO)) {
      showToast('Follow-up saved', restore);
    }
  };

  // Manual corrections to anything the analysis produced
  const handleUpdateRecording = (recordingId: string, patch: Partial<MeetingRecording>) => {
    const previous = recordings.find((r) => r.id === recordingId);
    if (!previous) return;
    setRecordings((prev) => prev.map((r) => (r.id === recordingId ? { ...r, ...patch } : r)));
    showToast('Changes saved', () =>
      setRecordings((prev) => prev.map((r) => (r.id === recordingId ? { ...previous, audioUrl: r.audioUrl } : r)))
    );
  };

  // Runs the analysis again on the stored audio and replaces the previous results
  const handleReanalyze = async (recordingId: string) => {
    const previous = recordings.find((r) => r.id === recordingId);
    if (!previous || reanalyzingId) return;

    setReanalyzingId(recordingId);
    try {
      const audio = await loadRecordingAudio(recordingId);
      if (!audio) {
        showToast('The audio for this recording is no longer stored, so it cannot be re-analyzed.');
        return;
      }
      const extracted = await requestAnalysis(audio, {
        filename: previous.filename,
        mimeType: audio.type,
        languageMode: previous.languageMode,
      });
      const fields = buildAnalysisFields(extracted, {
        recordingId,
        languageMode: previous.languageMode,
        clientId: previous.clientId,
        filename: previous.filename,
      });

      setRecordings((prev) => prev.map((r) => (r.id === recordingId ? { ...r, ...fields } : r)));
      if (previous.clientId) {
        setClients((prev) => prev.map((c) => (c.id === previous.clientId ? withAnalysis(c, fields) : c)));
      }
      notifyIfAway('Analysis updated', previous.title, `/?recording=${encodeURIComponent(recordingId)}`);
      showToast('Analysis updated', () =>
        setRecordings((prev) => prev.map((r) => (r.id === recordingId ? { ...previous, audioUrl: r.audioUrl } : r)))
      );
    } catch (err: any) {
      console.error('Re-analysis error:', err);
      showToast(err?.message || 'The recording could not be re-analyzed.');
    } finally {
      setReanalyzingId(null);
    }
  };

  const setTaskStatus = (taskId: string, toggle: boolean) => {
    setRecordings((prev) =>
      prev.map((r) => ({
        ...r,
        tasks: r.tasks.map((t) => {
          if (t.id === taskId && toggle) {
            const nextStatus: MeetingTask['status'] = t.status === 'Completed' ? 'Pending' : 'Completed';
            return { ...t, status: nextStatus };
          }
          return t;
        }),
      }))
    );
  };

  const handleGlobalToggleTaskStatus = (taskId: string) => {
    const task = recordings.flatMap((r) => r.tasks).find((t) => t.id === taskId);
    if (!task) return;
    setTaskStatus(taskId, true);
    showToast(task.status === 'Completed' ? 'Marked as pending' : 'Marked as done', () => setTaskStatus(taskId, true));
  };

  // Client management handlers
  const handleAddClient = (newClient: ClientLead) => {
    setClients((prev) => [newClient, ...prev]);
    showToast('Patient added');
  };

  const handleUpdateClient = (updatedClient: ClientLead) => {
    const previous = clients.find((c) => c.id === updatedClient.id);
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    showToast(
      'Patient saved',
      previous && (() => setClients((prev) => prev.map((c) => (c.id === previous.id ? previous : c))))
    );
  };

  const handleDeleteClient = (clientId: string) => {
    const index = clients.findIndex((c) => c.id === clientId);
    if (index < 0) return;
    const target = clients[index];
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    showToast('Patient removed', () =>
      setClients((prev) => {
        if (prev.some((c) => c.id === clientId)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, target);
        return next;
      })
    );
  };

  const dataReady = leadsLoaded && recordingsLoaded;

  // Notifications link to /?page=… or /?recording=…: open that place once the data is in, then tidy the address
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (!dataReady || deepLinkHandledRef.current) return;
    deepLinkHandledRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') as NavigationPage | null;
    const recordingId = params.get('recording');
    if (recordingId && recordings.some((r) => r.id === recordingId)) handleSelectRecording(recordingId);
    else if (page && ['dashboard', 'patients', 'insights', 'follow-ups', 'recordings', 'settings'].includes(page)) navigateTo(page);
    if (page || recordingId) window.history.replaceState(null, '', window.location.pathname);
  }, [dataReady]);

  // Currently selected recording object
  const currentRecording = selectedRecordingId
    ? recordings.find((r) => r.id === selectedRecordingId) || null
    : null;

  const pendingTasksCount = recordings.reduce(
    (acc, r) => acc + r.tasks.filter((t) => t.status !== 'Completed').length,
    0
  );

  // Browser tab title (the patients screen sets its own, since it knows which profile is open)
  useEffect(() => {
    if (currentRecording) {
      document.title = `${currentRecording.title} – MeetMind`;
    } else if (activePage !== 'patients') {
      document.title = `${PAGE_TITLES[activePage]} – MeetMind`;
    }
  }, [activePage, currentRecording?.id, currentRecording?.title]);

  return (
    <div
      className={`${
        isDarkMode ? 'dark' : ''
      } min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex transition-colors`}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* Sidebar */}
      <Sidebar
        activePage={currentRecording || activePage === 'recordings' ? 'patients' : activePage}
        onNavigate={navigateTo}
        pendingTasksCount={pendingTasksCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          recordings={recordings}
          clients={clients}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenRecording={handleSelectRecording}
          onOpenPatient={handleOpenPatient}
          onToggleTaskStatus={handleGlobalToggleTaskStatus}
          onOpenFollowUps={() => navigateTo('follow-ups')}
          onOpenSettings={() => navigateTo('settings')}
          user={user}
          onSignOut={onSignOut}
        />

        {/* View Content */}
        <main className="flex-1 px-3 pt-4 pb-4 sm:px-4 sm:pb-6 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {!isOnline && (
            <div role="status" className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-sm text-gray-800 dark:text-gray-200">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              You're offline. Changes you make now will be saved when the connection returns.
            </div>
          )}

          {leadsError && (
            <div role="alert" className="mb-4 px-4 py-3 rounded-lg border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-800 dark:text-rose-200">
              Data could not be loaded from the database: {leadsError}. Check that both SQL files in the supabase folder have been run.
            </div>
          )}

          {!dataReady && !leadsError && (
            <div role="status" className="py-24 flex flex-col items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              Loading your patients and recordings…
            </div>
          )}

          <div className={!dataReady && !leadsError ? 'hidden' : ''}>
          <Suspense
            fallback={
              <div className="py-24 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" aria-label="Loading" />
              </div>
            }
          >
          {currentRecording ? (
            <MeetingDetailsView
              recording={currentRecording}
              client={clients.find((c) => c.id === currentRecording.clientId || c.recordingIds.includes(currentRecording.id))}
              onBack={() => setSelectedRecordingId(null)}
              onUpdateRecordingTasks={handleUpdateRecordingTasks}
              onUpdateRecording={handleUpdateRecording}
              onReanalyze={handleReanalyze}
              isReanalyzing={reanalyzingId === currentRecording.id}
              onNavigateToPatient={handleOpenPatient}
              initialTranscriptSearch={transcriptSearchSeed}
            />
          ) : (
            <>
              {activePage === 'dashboard' && (
                <DashboardView
                  recordings={recordings}
                  clients={clients}
                  onSelectRecording={handleSelectRecording}
                  onAddPatient={startNewPatient}
                  onNavigateToPatients={(clientId?: string) => {
                    if (clientId) {
                      setSelectedPatientIdForView(clientId);
                    }
                    setActivePage('patients');
                  }}
                  onNavigateToFollowUps={() => setActivePage('follow-ups')}
                  onNavigateToInsights={() => setActivePage('insights')}
                  onToggleTaskStatus={handleGlobalToggleTaskStatus}
                />
              )}

              {activePage === 'recordings' && (
                <RecordingsListView
                  recordings={recordings}
                  onSelectRecording={handleSelectRecording}
                  onDeleteRecording={handleDeleteRecording}
                  onAddPatient={startNewPatient}
                />
              )}

              {activePage === 'patients' && (
                <PatientsView
                  clients={clients}
                  recordings={recordings}
                  initialClientId={selectedPatientIdForView}
                  onClearInitialClientId={() => setSelectedPatientIdForView(null)}
                  onSelectRecording={handleSelectRecording}
                  onUploadForClient={(client, mode) => openUpload(client, mode)}
                  openNewPatient={openNewPatient}
                  onNewPatientOpened={() => setOpenNewPatient(false)}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onToggleTaskStatus={handleGlobalToggleTaskStatus}
                  onOpenRecordings={() => navigateTo('recordings')}
                />
              )}

              {activePage === 'insights' && (
                <InsightsView clients={clients} recordings={recordings} onOpenPatient={handleOpenPatient} />
              )}

              {activePage === 'follow-ups' && (
                <FollowUpsView
                  recordings={recordings}
                  clients={clients}
                  onToggleTaskStatus={handleGlobalToggleTaskStatus}
                  onOpenRecording={handleSelectRecording}
                  onUpdateRecordingTasks={handleUpdateRecordingTasks}
                  onOpenPatient={handleOpenPatient}
                />
              )}

              {activePage === 'settings' && (
                <SettingsView
                  defaultLanguage={defaultLanguage}
                  onUpdateDefaultLanguage={handleUpdateDefaultLanguage}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                />
              )}
            </>
          )}
          </Suspense>
          </div>
        </main>
      </div>

      {isUploadOpen && (
        <UploadDialog
          clients={clients}
          defaultLanguage={defaultLanguage}
          preSelectedClient={preSelectedClient}
          mode={uploadMode}
          onProcessingSuccess={handleProcessingSuccess}
          onClose={closeUpload}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
