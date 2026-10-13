import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  AlignLeft,
  Download,
  FileText,
  MessageSquare,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { MeetingRecording, MeetingTask, TranscriptSegment } from '../../types/meeting';
import { AudioPlayer } from '../AudioPlayer';
import { TaskDraft, TaskEditor } from '../TaskEditor';
import { EditButton, FormActions, LinesField, TextAreaField, TextField, fromLines, toLines } from '../EditForms';
import { RecordingGraphView } from './RecordingGraphView';
import { PitchReviewCard } from './PitchReview';
import { exportMeetingAsMarkdown, exportMeetingAsTxt, exportMeetingAsJson } from '../../utils/exportUtils';
import { describeDue } from '../../utils/tasks';
import {
  Avatar,
  Button,
  Card,
  chanceTone,
  formatRecordingDate,
  IconButton,
  muted,
  SearchInput,
  SectionTitle,
  SegmentedControl,
  SegmentOption,
  TaskRow,
} from '../ui';

interface MeetingDetailsViewProps {
  recording: MeetingRecording;
  onBack: () => void;
  onUpdateRecordingTasks: (recordingId: string, updatedTasks: MeetingTask[]) => void;
  onUpdateRecording: (recordingId: string, patch: Partial<MeetingRecording>) => void;
  onReanalyze: (recordingId: string) => void;
  isReanalyzing?: boolean;
  onNavigateToPatient?: (patientId: string) => void;
  initialTranscriptSearch?: string;
}

const VIEW_OPTIONS: SegmentOption<'text' | 'graph'>[] = [
  { id: 'text', label: 'Text view', icon: AlignLeft },
  { id: 'graph', label: 'Graph view', icon: BarChart3 },
];

const SPEAKER_STYLES = [
  { name: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  { name: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  { name: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500' },
  { name: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
];

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

// Finds the transcript line a quoted excerpt most likely came from
function findSegmentForExcerpt(excerpt: string | undefined, transcript: TranscriptSegment[]) {
  if (!excerpt) return null;
  const words = tokenize(excerpt);
  if (words.length === 0) return null;
  let best: TranscriptSegment | null = null;
  let bestScore = 0;
  for (const seg of transcript) {
    const segWords = new Set(tokenize(`${seg.text} ${seg.translatedText || ''}`));
    const score = words.filter((w) => segWords.has(w)).length / words.length;
    if (score > bestScore) {
      best = seg;
      bestScore = score;
    }
  }
  return bestScore >= 0.4 ? best : null;
}

const BulletList: React.FC<{ title: string; items: string[]; dot: string }> = ({ title, items, dot }) =>
  items.length === 0 ? null : (
    <div>
      <h3 className={`${muted} font-medium mb-1.5`}>{title}</h3>
      <ul className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 leading-snug">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dot}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

export const MeetingDetailsView: React.FC<MeetingDetailsViewProps> = ({
  recording,
  onBack,
  onUpdateRecordingTasks,
  onUpdateRecording,
  onReanalyze,
  isReanalyzing = false,
  onNavigateToPatient,
  initialTranscriptSearch = '',
}) => {
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState(initialTranscriptSearch);
  const [editingTaskId, setEditingTaskId] = useState<string | 'new' | null>(null);
  const [focusedSegmentId, setFocusedSegmentId] = useState<string | null>(null);

  // Which part of the analysis is being corrected by hand, and the text typed so far
  const [editing, setEditing] = useState<'header' | 'signals' | 'summary' | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentDraft, setSegmentDraft] = useState({ speaker: '', text: '', translatedText: '', renameAll: true });
  const setField = (key: string) => (value: string) => setDraft((prev) => ({ ...prev, [key]: value }));
  const [viewMode, setViewMode] = useState<'text' | 'graph'>(() => {
    try {
      return localStorage.getItem('meetmind_recording_view_v1') === 'graph' ? 'graph' : 'text';
    } catch {
      return 'text';
    }
  });

  const switchView = (mode: 'text' | 'graph') => {
    setViewMode(mode);
    try {
      localStorage.setItem('meetmind_recording_view_v1', mode);
    } catch {}
  };

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setTranscriptSearch(initialTranscriptSearch);
  }, [initialTranscriptSearch, recording.id]);

  const handleToggleTask = (taskId: string) => {
    onUpdateRecordingTasks(
      recording.id,
      recording.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'Completed' ? ('Pending' as const) : ('Completed' as const) }
          : t
      )
    );
  };

  const handleSaveTask = (draft: TaskDraft) => {
    if (editingTaskId === 'new') {
      const newTask: MeetingTask = {
        ...draft,
        id: `${recording.id}-task-${Date.now()}`,
        status: 'Pending',
        recordingId: recording.id,
        clientId: recording.clientId,
      };
      onUpdateRecordingTasks(recording.id, [...recording.tasks, newTask]);
    } else {
      onUpdateRecordingTasks(
        recording.id,
        recording.tasks.map((t) => (t.id === editingTaskId ? { ...t, ...draft } : t))
      );
    }
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateRecordingTasks(
      recording.id,
      recording.tasks.filter((t) => t.id !== taskId)
    );
    setEditingTaskId(null);
  };

  const chance = recording.estimatedConversionChance;
  const hasChance = typeof chance === 'number' && !isNaN(chance);
  const tone = hasChance ? chanceTone(chance!) : null;

  const positives = recording.conversionFactors?.positive || [];

  // Each concern, linked to the transcript line it was taken from when one can be found
  const concerns = useMemo(() => {
    if (recording.conversionBarriers && recording.conversionBarriers.length > 0) {
      return recording.conversionBarriers.map((b) => ({
        text: b.description,
        segment: findSegmentForExcerpt(b.supportingExcerpt, recording.transcript),
      }));
    }
    const fallback = recording.conversionFactors?.negative?.length
      ? recording.conversionFactors.negative
      : recording.patientHesitation
      ? [recording.patientHesitation]
      : [];
    return fallback.map((text) => ({ text, segment: null as TranscriptSegment | null }));
  }, [recording]);

  const keyPoints = useMemo(() => {
    if (recording.summary.quickBulletOverview?.length) return recording.summary.quickBulletOverview;
    return (recording.summary.keyTopics || []).map((t) => t.title);
  }, [recording]);

  const nextSteps = useMemo(() => {
    if (recording.agreedNextSteps?.length) return recording.agreedNextSteps;
    return recording.summary.outcomes || [];
  }, [recording]);

  const speakerStyles = useMemo(() => {
    const map: Record<string, (typeof SPEAKER_STYLES)[number]> = {};
    recording.transcript.forEach((seg) => {
      if (!map[seg.speaker]) {
        map[seg.speaker] = SPEAKER_STYLES[Object.keys(map).length % SPEAKER_STYLES.length];
      }
    });
    return map;
  }, [recording.transcript]);

  const filteredTranscript = useMemo(() => {
    const q = transcriptSearch.toLowerCase().trim();
    if (!q) return recording.transcript;
    return recording.transcript.filter(
      (seg) =>
        seg.text.toLowerCase().includes(q) ||
        seg.speaker.toLowerCase().includes(q) ||
        (seg.translatedText && seg.translatedText.toLowerCase().includes(q))
    );
  }, [recording.transcript, transcriptSearch]);

  // The segment being played, so only one row is highlighted
  const playingSegmentId = useMemo(() => {
    let active: string | null = null;
    for (const seg of recording.transcript) {
      if (seg.startSeconds <= currentPlaybackTime) active = seg.id;
      else break;
    }
    return currentPlaybackTime > 0 ? active : null;
  }, [recording.transcript, currentPlaybackTime]);

  const activeSegmentId = focusedSegmentId || playingSegmentId;

  // Keep the active line in view inside the transcript panel
  useEffect(() => {
    const container = transcriptRef.current;
    const el = activeSegmentId ? segmentRefs.current[activeSegmentId] : null;
    if (!container || !el) return;
    container.scrollTo({ top: el.offsetTop - container.clientHeight / 3, behavior: 'smooth' });
  }, [activeSegmentId]);

  // A jumped-to line stays highlighted until playback moves on to another one
  useEffect(() => {
    if (focusedSegmentId && playingSegmentId && playingSegmentId !== focusedSegmentId) {
      setFocusedSegmentId(null);
    }
  }, [playingSegmentId, focusedSegmentId]);

  const jumpToSegment = (segment: TranscriptSegment) => {
    setTranscriptSearch('');
    setFocusedSegmentId(segment.id);
    setCurrentPlaybackTime(segment.startSeconds);
  };

  const startEdit = (section: 'header' | 'signals' | 'summary') => {
    setDraft(
      section === 'header'
        ? { title: recording.title, salesperson: recording.salespersonName || '' }
        : section === 'signals'
        ? { positives: toLines(positives), concerns: toLines(concerns.map((c) => c.text)) }
        : {
            summary: recording.summary.executiveSummary || recording.patientGoal || '',
            keyPoints: toLines(keyPoints),
            nextSteps: toLines(nextSteps),
          }
    );
    setEditing(section);
  };

  const saveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing === 'header') {
      onUpdateRecording(recording.id, {
        title: draft.title.trim() || recording.title,
        salespersonName: draft.salesperson.trim() || undefined,
      });
    } else if (editing === 'signals') {
      const concernLines = fromLines(draft.concerns);
      const existing = recording.conversionBarriers || [];
      onUpdateRecording(recording.id, {
        conversionFactors: { positive: fromLines(draft.positives), negative: concernLines },
        // Unchanged concerns keep their link to the transcript; new ones are added as written
        conversionBarriers: concernLines.map(
          (text, i) =>
            existing.find((b) => b.description === text) || {
              id: `b-${Date.now()}-${i}`,
              category: 'Other' as const,
              description: text,
              isExplicit: true,
            }
        ),
        patientHesitation: undefined,
      });
    } else if (editing === 'summary') {
      const points = fromLines(draft.keyPoints);
      const steps = fromLines(draft.nextSteps);
      onUpdateRecording(recording.id, {
        summary: {
          ...recording.summary,
          executiveSummary: draft.summary.trim(),
          quickBulletOverview: points,
          keyTopics: points.length ? recording.summary.keyTopics : [],
          outcomes: steps.length ? recording.summary.outcomes : [],
        },
        agreedNextSteps: steps,
        patientGoal: draft.summary.trim() ? recording.patientGoal : undefined,
      });
    }
    setEditing(null);
  };

  const startSegmentEdit = (segment: TranscriptSegment) => {
    setSegmentDraft({
      speaker: segment.speaker,
      text: segment.text,
      translatedText: segment.translatedText || '',
      renameAll: true,
    });
    setEditingSegmentId(segment.id);
  };

  const saveSegment = (e: React.FormEvent) => {
    e.preventDefault();
    const original = recording.transcript.find((seg) => seg.id === editingSegmentId);
    if (!original) return;
    const speaker = segmentDraft.speaker.trim() || original.speaker;
    const renameEverywhere = segmentDraft.renameAll && speaker !== original.speaker;
    onUpdateRecording(recording.id, {
      transcript: recording.transcript.map((seg) =>
        seg.id === editingSegmentId
          ? {
              ...seg,
              speaker,
              text: segmentDraft.text.trim() || seg.text,
              translatedText: segmentDraft.translatedText.trim() || undefined,
            }
          : renameEverywhere && seg.speaker === original.speaker
          ? { ...seg, speaker }
          : seg
      ),
    });
    setEditingSegmentId(null);
  };

  const completedTasksCount = recording.tasks.filter((t) => t.status === 'Completed').length;
  const summaryText = recording.summary.executiveSummary || recording.patientGoal;

  const exportOptions = [
    { label: 'Markdown', run: exportMeetingAsMarkdown },
    { label: 'Plain text', run: exportMeetingAsTxt },
    { label: 'JSON', run: exportMeetingAsJson },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton onClick={onBack} title="Back" aria-label="Back to recordings">
            <ArrowLeft className="w-5 h-5" />
          </IconButton>
          {recording.clientName && <Avatar name={recording.clientName} size="lg" />}
          {editing === 'header' ? (
            <form onSubmit={saveSection} className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 items-end">
              <TextField label="Title" value={draft.title || ''} onChange={setField('title')} autoFocus />
              <TextField label="Salesperson" value={draft.salesperson || ''} onChange={setField('salesperson')} />
              <FormActions onCancel={() => setEditing(null)} />
            </form>
          ) : (
          <div className="min-w-0 self-center">
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{recording.title}</h1>
              <EditButton onClick={() => startEdit('header')} label="Edit title and salesperson" />
            </div>
            <p className={`${muted} mt-0.5`}>
              {recording.clientName &&
                (recording.clientId && onNavigateToPatient ? (
                  <button
                    onClick={() => onNavigateToPatient(recording.clientId!)}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {recording.clientName}
                  </button>
                ) : (
                  <span>{recording.clientName}</span>
                ))}
              {recording.clientName && ' · '}
              {[recording.salespersonName, formatRecordingDate(recording.uploadDate).date].filter(Boolean).join(' · ')}
            </p>
          </div>
          )}
        </div>

        <div className="relative shrink-0 flex items-center gap-2">
          <SegmentedControl<'text' | 'graph'>
            value={viewMode}
            onChange={switchView}
            options={VIEW_OPTIONS}
            iconOnlyBelowLg
            aria-label="View"
          />
          <Button
            variant="ghost"
            onClick={() => onReanalyze(recording.id)}
            disabled={Boolean(recording.isDemo) || isReanalyzing}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              recording.isDemo
                ? 'Sample recordings have no real audio to analyze'
                : 'Run the analysis again on the stored audio'
            }
          >
            <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">{isReanalyzing ? 'Analyzing…' : 'Re-analyze'}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            aria-expanded={isExportMenuOpen}
            aria-haspopup="true"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          {isExportMenuOpen && (
            <Card className="absolute right-0 top-full mt-1 w-36 py-1 shadow-md z-30">
              {exportOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    opt.run(recording);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </Card>
          )}
        </div>
      </header>

      {isReanalyzing && (
        <div className="px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-sm text-gray-800 dark:text-gray-200" role="status">
          Re-analyzing this recording. This can take a minute; the results below will be replaced when it finishes.
        </div>
      )}

      {/* Player stays pinned while the page scrolls */}
      <div className="sticky top-[57px] md:top-0 z-20 -mx-1 px-1 py-2 bg-gray-50 dark:bg-gray-900">
        <AudioPlayer
          audioUrl={recording.audioUrl}
          duration={recording.duration}
          currentTime={currentPlaybackTime}
          onTimeUpdate={setCurrentPlaybackTime}
        />
      </div>

      {viewMode === 'graph' && (
        <RecordingGraphView
          recording={recording}
          currentTime={currentPlaybackTime}
          positives={positives}
          concerns={concerns}
          keyPoints={keyPoints}
          nextSteps={nextSteps}
          onSeek={setCurrentPlaybackTime}
          onToggleTask={handleToggleTask}
        />
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 items-start ${viewMode === 'graph' ? 'hidden' : ''}`}>
        {/* Left: conversion + follow-ups */}
        <div className="lg:col-span-2 space-y-4">
          <Card as="section" className="p-5">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle icon={TrendingUp}>Conversion probability</SectionTitle>
              {editing !== 'signals' && (
                <EditButton onClick={() => startEdit('signals')} label="Edit in favour and concerns" />
              )}
            </div>

            {hasChance && tone ? (
              <>
                <div className="mt-4 flex items-baseline gap-2.5">
                  <span className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
                    {chance}%
                  </span>
                  <span className={`text-sm font-medium ${tone.text}`}>{tone.label}</span>
                </div>
                <div className="mt-3 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${chance}%` }} />
                </div>
              </>
            ) : (
              <p className={`${muted} mt-2`}>No estimate for this recording.</p>
            )}

            {editing === 'signals' && (
              <form onSubmit={saveSection} className="mt-5 space-y-3">
                <LinesField label="In favour" value={draft.positives || ''} onChange={setField('positives')} autoFocus />
                <LinesField label="Concerns" value={draft.concerns || ''} onChange={setField('concerns')} />
                <FormActions onCancel={() => setEditing(null)} />
              </form>
            )}

            {editing !== 'signals' && (positives.length > 0 || concerns.length > 0) && (
              <div className="mt-5 space-y-4">
                <BulletList title="In favour" items={positives} dot="bg-emerald-500" />

                {concerns.length > 0 && (
                  <div>
                    <h3 className={`${muted} font-medium mb-1.5`}>Concerns</h3>
                    <ul className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
                      {concerns.map((concern, i) => (
                        <li key={i} className="flex items-start gap-2 leading-snug">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-amber-500" />
                          <span>
                            {concern.text}{' '}
                            {concern.segment && (
                              <button
                                onClick={() => jumpToSegment(concern.segment!)}
                                className="text-xs tabular-nums font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                                title="Jump to where this was said"
                              >
                                ▸ {concern.segment.timestamp}
                              </button>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card as="section" className="p-5">
            <div className="flex items-center justify-between">
              <SectionTitle icon={CalendarCheck}>Follow-ups</SectionTitle>
              <div className="flex items-center gap-3">
                {recording.tasks.length > 0 && (
                  <span className={`${muted} tabular-nums`}>
                    {completedTasksCount}/{recording.tasks.length} done
                  </span>
                )}
                {editingTaskId !== 'new' && (
                  <Button variant="link" onClick={() => setEditingTaskId('new')}>
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                )}
              </div>
            </div>

            {recording.tasks.length === 0 && editingTaskId !== 'new' && (
              <p className={`${muted} mt-2`}>No follow-ups came out of this conversation.</p>
            )}

            <div className="mt-1 divide-y divide-gray-100 dark:divide-gray-700/60">
              {recording.tasks.map((task) => {
                const due = describeDue(task, recording.uploadDate);
                return editingTaskId === task.id ? (
                  <TaskEditor
                    key={task.id}
                    task={task}
                    initialDueISO={due.iso}
                    onSave={handleSaveTask}
                    onCancel={() => setEditingTaskId(null)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ) : (
                  <TaskRow
                    key={task.id}
                    task={task}
                    due={due}
                    onToggle={() => handleToggleTask(task.id)}
                    onEdit={() => setEditingTaskId(task.id)}
                  />
                );
              })}
              {editingTaskId === 'new' && (
                <TaskEditor onSave={handleSaveTask} onCancel={() => setEditingTaskId(null)} />
              )}
            </div>
          </Card>
        </div>

        {/* Right: summary + transcript */}
        <div className="lg:col-span-3 space-y-4">
          <Card as="section" className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle icon={FileText}>Summary</SectionTitle>
              {editing !== 'summary' && <EditButton onClick={() => startEdit('summary')} label="Edit summary" />}
            </div>
            {editing === 'summary' ? (
              <form onSubmit={saveSection} className="space-y-3">
                <TextAreaField label="Summary" value={draft.summary || ''} onChange={setField('summary')} rows={5} autoFocus />
                <LinesField label="Key points" value={draft.keyPoints || ''} onChange={setField('keyPoints')} />
                <LinesField label="Next steps" value={draft.nextSteps || ''} onChange={setField('nextSteps')} />
                <FormActions onCancel={() => setEditing(null)} />
              </form>
            ) : (
              <>
                {summaryText ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{summaryText}</p>
                ) : (
                  <p className={muted}>No summary available.</p>
                )}
                <BulletList title="Key points" items={keyPoints} dot="bg-gray-400" />
                <BulletList title="Next steps" items={nextSteps} dot="bg-blue-500" />
              </>
            )}
          </Card>

          <PitchReviewCard
            pitch={recording.pitchAnalysis}
            onJump={(seconds) => {
              // Land on the transcript line that was being spoken at that moment
              const line = [...recording.transcript].reverse().find((seg) => seg.startSeconds <= seconds);
              if (line) jumpToSegment(line);
              else setCurrentPlaybackTime(seconds);
            }}
          />

          <Card as="section" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle icon={MessageSquare}>Transcript</SectionTitle>
              {recording.transcript.length > 0 && (
                <SearchInput
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Search"
                  aria-label="Search transcript"
                  wrapperClassName="w-44 sm:w-56"
                  className="py-1.5"
                />
              )}
            </div>

            {filteredTranscript.length === 0 ? (
              <p className={`${muted} mt-3`}>
                {recording.transcript.length === 0 ? 'No transcript available.' : 'No matches.'}
              </p>
            ) : (
              <div ref={transcriptRef} className="relative mt-3 max-h-[560px] overflow-y-auto pr-1 space-y-1">
                {filteredTranscript.map((segment) => {
                  const style = speakerStyles[segment.speaker] || SPEAKER_STYLES[0];
                  return (
                    <div
                      key={segment.id}
                      ref={(el) => {
                        segmentRefs.current[segment.id] = el;
                      }}
                      className={`group pl-3 pr-2 py-2 border-l-2 rounded-r-md transition-colors ${style.border} ${
                        segment.id === activeSegmentId ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                      }`}
                    >
                      {editingSegmentId === segment.id ? (
                        <form onSubmit={saveSegment} className="space-y-2 py-1">
                          <TextField
                            label="Speaker"
                            value={segmentDraft.speaker}
                            onChange={(speaker) => setSegmentDraft((prev) => ({ ...prev, speaker }))}
                          />
                          {segmentDraft.speaker.trim() !== segment.speaker && segmentDraft.speaker.trim() !== '' && (
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={segmentDraft.renameAll}
                                onChange={(e) => setSegmentDraft((prev) => ({ ...prev, renameAll: e.target.checked }))}
                                className="accent-blue-600"
                              />
                              Rename “{segment.speaker}” on every line
                            </label>
                          )}
                          <TextAreaField
                            label="What was said"
                            value={segmentDraft.text}
                            onChange={(text) => setSegmentDraft((prev) => ({ ...prev, text }))}
                            rows={3}
                            autoFocus
                          />
                          <TextAreaField
                            label="Translation"
                            value={segmentDraft.translatedText}
                            onChange={(translatedText) => setSegmentDraft((prev) => ({ ...prev, translatedText }))}
                            rows={2}
                          />
                          <FormActions onCancel={() => setEditingSegmentId(null)} />
                        </form>
                      ) : (
                        <>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${style.name}`}>{segment.speaker}</span>
                        <button
                          onClick={() => {
                            setFocusedSegmentId(segment.id);
                            setCurrentPlaybackTime(segment.startSeconds);
                          }}
                          className="text-xs tabular-nums text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                          title="Play from here"
                        >
                          {segment.timestamp}
                        </button>
                        <EditButton
                          onClick={() => startSegmentEdit(segment)}
                          label="Edit this line"
                          className="ml-auto self-center -my-1 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                        />
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          segment.isUnclear
                            ? 'text-gray-500 dark:text-gray-400 italic'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {segment.text}
                      </p>
                      {segment.translatedText && (
                        <p className={`${muted} mt-1 leading-relaxed`}>{segment.translatedText}</p>
                      )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
