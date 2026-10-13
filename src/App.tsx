/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MeetingRecording, MeetingTask, LanguageMode, ClientLead } from './types/meeting';
import { SAMPLE_RECORDINGS } from './data/sampleRecordings';
import { SAMPLE_CLIENTS } from './data/sampleClients';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { PatientsView } from './components/views/PatientsView';
import { RecordingsListView } from './components/views/RecordingsListView';
import { FollowUpsView } from './components/views/FollowUpsView';
import { SettingsView } from './components/views/SettingsView';
import { InsightsView } from './components/views/InsightsView';
import { MeetingDetailsView } from './components/views/MeetingDetailsView';
import { TopNavbar } from './components/TopNavbar';
import { UploadDialog } from './components/UploadDialog';
import { Toast, ToastMessage } from './components/ui';
import { clearRecordingAudio, deleteRecordingAudio, loadRecordingAudio } from './utils/audioStore';
import { buildAnalysisFields, requestAnalysis } from './utils/analyzeRecording';
import { normalizeLead, withAnalysis } from './utils/leads';

const STORAGE_KEY_RECORDINGS = 'meetmind_eyecare_recordings_v4';
const STORAGE_KEY_CLIENTS = 'meetmind_eyecare_clients_v4';
const STORAGE_KEY_THEME = 'meetmind_theme_v1';
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

// Sample recordings get their synthetic audio back; uploads are rehydrated from IndexedDB later
const restoreSampleAudio = (list: MeetingRecording[]): MeetingRecording[] =>
  list.map(({ audioUrl, ...rest }) => {
    const sample = SAMPLE_RECORDINGS.find((s) => s.id === rest.id);
    return {
      ...rest,
      audioUrl: sample?.audioUrl,
      pitchAnalysis: rest.pitchAnalysis || sample?.pitchAnalysis,
      // Sample recordings saved before the timeline existed pick it up here
      conversionTimeline: rest.conversionTimeline || sample?.conversionTimeline,
    };
  });

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [clients, setClients] = useState<ClientLead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].condition) {
          return parsed.map(normalizeLead);
        }
      }
    } catch (e) {
      console.warn('Failed to load clients from localStorage:', e);
    }
    return SAMPLE_CLIENTS;
  });

  // Recordings state
  const [recordings, setRecordings] = useState<MeetingRecording[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isOphthalmicRecording)) {
          return restoreSampleAudio(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load recordings from localStorage:', e);
    }
    return SAMPLE_RECORDINGS;
  });

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
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDarkMode]);

  // Sync recordings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDINGS, JSON.stringify(stripAudioUrls(recordings)));
    } catch (e) {
      console.warn('Failed to save recordings to localStorage:', e);
    }
  }, [recordings]);

  // Rehydrate audio for uploaded recordings from IndexedDB
  useEffect(() => {
    let cancelled = false;
    recordings
      .filter((r) => !r.audioUrl)
      .forEach(async (r) => {
        const audio = await loadRecordingAudio(r.id);
        if (!audio || cancelled) return;
        const audioUrl = URL.createObjectURL(audio);
        setRecordings((prev) =>
          prev.map((rec) => (rec.id === r.id && !rec.audioUrl ? { ...rec, audioUrl } : rec))
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync clients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.warn('Failed to save clients to localStorage:', e);
    }
  }, [clients]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
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
  const openUpload = (client: ClientLead) => {
    setPreSelectedClient(client);
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

  const handleResetToClinicalData = () => {
    setRecordings(SAMPLE_RECORDINGS);
    setClients(SAMPLE_CLIENTS);
    setSelectedRecordingId(null);
    clearRecordingAudio();
    try {
      localStorage.setItem(STORAGE_KEY_RECORDINGS, JSON.stringify(stripAudioUrls(SAMPLE_RECORDINGS)));
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(SAMPLE_CLIENTS));
    } catch (e) {
      console.warn('Failed to reset storage:', e);
    }
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
        activePage={currentRecording ? 'recordings' : activePage}
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
        />

        {/* View Content */}
        <main className="flex-1 px-4 pt-5 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 max-w-6xl w-full mx-auto">
          {currentRecording ? (
            <MeetingDetailsView
              recording={currentRecording}
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
                  onUploadForClient={(client) => openUpload(client)}
                  openNewPatient={openNewPatient}
                  onNewPatientOpened={() => setOpenNewPatient(false)}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onToggleTaskStatus={handleGlobalToggleTaskStatus}
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
                  onResetToClinicalData={handleResetToClinicalData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {isUploadOpen && (
        <UploadDialog
          clients={clients}
          defaultLanguage={defaultLanguage}
          preSelectedClient={preSelectedClient}
          onProcessingSuccess={handleProcessingSuccess}
          onClose={closeUpload}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
