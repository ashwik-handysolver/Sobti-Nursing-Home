import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Download,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  Plus,
  Presentation,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { ClientLead, ConversionPoint, MeetingRecording, MeetingTask, TranscriptSegment } from '../../types/meeting';
import { AudioPlayer } from '../AudioPlayer';
import { TaskDraft, TaskEditor } from '../TaskEditor';
import { EditButton, FormActions, LinesField, TextAreaField, TextField, fromLines, toLines } from '../EditForms';
import { PitchReviewCard } from './PitchReview';
import { NextActionCard } from '../recording/NextActionCard';
import { exportMeetingAsMarkdown } from '../../utils/exportUtils';
import { describeDue } from '../../utils/tasks';
import { concernsOf } from '../../utils/conversion';
import {
  Avatar,
  BulletList,
  Button,
  chanceTone,
  formatRecordingDate,
  IconButton,
  muted,
  Panel,
  SearchInput,
  TabOption,
  Tabs,
  TaskRow,
} from '../ui';

interface MeetingDetailsViewProps {
  recording: MeetingRecording;
  client?: ClientLead; // the lead this recording belongs to, when it is linked
  onBack: () => void;
  onUpdateRecordingTasks: (recordingId: string, updatedTasks: MeetingTask[]) => void;
  onUpdateRecording: (recordingId: string, patch: Partial<MeetingRecording>) => void;
  onReanalyze: (recordingId: string) => void;
  isReanalyzing?: boolean;
  onNavigateToPatient?: (patientId: string) => void;
  initialTranscriptSearch?: string;
}

type DetailTab = 'overview' | 'pitch' | 'transcript';

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

// The two moments that moved the likelihood most, in the order they happened
function turningPoints(timeline: ConversionPoint[] | undefined) {
  if (!timeline || timeline.length < 2) return [];
  return timeline
    .slice(1)
    .map((point, i) => ({ ...point, change: point.score - timeline[i].score }))
    .filter((p) => p.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 2)
    .sort((a, b) => a.seconds - b.seconds);
}

export const MeetingDetailsView: React.FC<MeetingDetailsViewProps> = ({
  recording,
  client,
  onBack,
  onUpdateRecordingTasks,
  onUpdateRecording,
  onReanalyze,
  isReanalyzing = false,
  onNavigateToPatient,
  initialTranscriptSearch = '',
}) => {
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [transcriptSearch, setTranscriptSearch] = useState(initialTranscriptSearch);
  const [editingTaskId, setEditingTaskId] = useState<string | 'new' | null>(null);
  const [focusedSegmentId, setFocusedSegmentId] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>(initialTranscriptSearch ? 'transcript' : 'overview');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  // Which part of the analysis is being corrected by hand, and the text typed so far
  const [editing, setEditing] = useState<'header' | 'summary' | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentDraft, setSegmentDraft] = useState({ speaker: '', text: '', translatedText: '', renameAll: true });
  const setField = (key: string) => (value: string) => setDraft((prev) => ({ ...prev, [key]: value }));
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setTranscriptSearch(initialTranscriptSearch);
    if (initialTranscriptSearch) setTab('transcript');
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
  const startChance = recording.conversionTimeline?.[0]?.score;
  const moments = useMemo(() => turningPoints(recording.conversionTimeline), [recording.conversionTimeline]);

  const positives = recording.conversionFactors?.positive || [];

  // Each concern, linked to the transcript line it was taken from when one can be found
  const concerns = useMemo(
    () =>
      concernsOf(recording).map((c) => ({
        text: c.text,
        segment: findSegmentForExcerpt(c.excerpt, recording.transcript),
      })),
    [recording]
  );

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
  }, [activeSegmentId, tab]);

  // A jumped-to line stays highlighted until playback moves on to another one
  useEffect(() => {
    if (focusedSegmentId && playingSegmentId && playingSegmentId !== focusedSegmentId) {
      setFocusedSegmentId(null);
    }
  }, [playingSegmentId, focusedSegmentId]);

  const jumpToSegment = (segment: TranscriptSegment) => {
    setTranscriptSearch('');
    setTab('transcript');
    setFocusedSegmentId(segment.id);
    setCurrentPlaybackTime(segment.startSeconds);
  };

  // Land on the transcript line that was being spoken at a moment
  const jumpToSeconds = (seconds: number) => {
    const line = [...recording.transcript].reverse().find((seg) => seg.startSeconds <= seconds);
    if (line) jumpToSegment(line);
    else setCurrentPlaybackTime(seconds);
  };

  const startEdit = (section: 'header' | 'summary') => {
    setDraft(
      section === 'header'
        ? { title: recording.title, salesperson: recording.salespersonName || '' }
        : {
            summary: recording.summary.executiveSummary || recording.patientGoal || '',
            keyPoints: toLines(keyPoints),
            concerns: toLines(concerns.map((c) => c.text)),
            positives: toLines(positives),
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
    } else if (editing === 'summary') {
      const points = fromLines(draft.keyPoints);
      const steps = fromLines(draft.nextSteps);
      const concernLines = fromLines(draft.concerns);
      const existing = recording.conversionBarriers || [];
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

  // Each tab says how much is behind it
  const tabs: TabOption<DetailTab>[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pitch', label: 'Consultation review', icon: Presentation, badge: recording.pitchAnalysis?.overallScore },
    { id: 'transcript', label: 'Transcript', icon: MessageSquare, badge: recording.transcript.length || undefined },
  ];

  const renderConcern = (concern: (typeof concerns)[number]) => (
    <>
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
    </>
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton onClick={onBack} title="Back" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </IconButton>
          {recording.clientName && <Avatar name={recording.clientName} size="lg" />}
          {editing === 'header' ? (
            <form onSubmit={saveSection} className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 items-end">
              <TextField label="Title" value={draft.title || ''} onChange={setField('title')} autoFocus />
              <TextField label="Led by" value={draft.salesperson || ''} onChange={setField('salesperson')} />
              <FormActions onCancel={() => setEditing(null)} />
            </form>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:truncate">{recording.title}</h1>
                <EditButton onClick={() => startEdit('header')} label="Edit title and who led the consultation" />
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

        <div className="shrink-0 self-end sm:self-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            onClick={() => onReanalyze(recording.id)}
            disabled={Boolean(recording.isDemo) || isReanalyzing}
            title={
              recording.isDemo
                ? 'Sample recordings have no real audio to analyze'
                : 'Run the analysis again on the stored audio'
            }
          >
            <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span>{isReanalyzing ? 'Analyzing…' : 'Re-analyze'}</span>
          </Button>
          <Button variant="ghost" onClick={() => exportMeetingAsMarkdown(recording)} title="Download the analysis as a report">
            <Download className="w-4 h-4" />
            <span>Report</span>
          </Button>
        </div>
      </header>

      {isReanalyzing && (
        <div className="px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-sm text-gray-800 dark:text-gray-200" role="status">
          Re-analyzing this recording. This can take a minute; the results below will be replaced when it finishes.
        </div>
      )}

      {/* Player stays pinned while the page scrolls */}
      <div className="sticky top-[68px] z-20 -mx-1 px-1 py-2 bg-gray-50 dark:bg-gray-900">
        <AudioPlayer
          audioUrl={recording.audioUrl}
          duration={recording.duration}
          currentTime={currentPlaybackTime}
          onTimeUpdate={setCurrentPlaybackTime}
        />
      </div>

      <Tabs<DetailTab> value={tab} onChange={setTab} options={tabs} aria-label="Recording sections" />

      {tab === 'overview' && (
        <div className="space-y-5">
          <NextActionCard
            recording={recording}
            client={client}
            nextStep={nextSteps[0] || client?.conversionNextStep}
            concern={concerns[0]}
            onJump={jumpToSegment}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
            <Panel
              title="Consultation summary"
              icon={FileText}
              action={editing !== 'summary' && <EditButton onClick={() => startEdit('summary')} label="Edit summary" />}
              className="xl:col-span-2"
            >
              {editing === 'summary' ? (
                <form onSubmit={saveSection} className="space-y-3">
                  <TextAreaField label="Summary (used in the report)" value={draft.summary || ''} onChange={setField('summary')} rows={3} autoFocus />
                  <LinesField label="Key points" value={draft.keyPoints || ''} onChange={setField('keyPoints')} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <LinesField label="Concerns" value={draft.concerns || ''} onChange={setField('concerns')} />
                    <LinesField label="In favour" value={draft.positives || ''} onChange={setField('positives')} />
                  </div>
                  <LinesField label="Next steps" value={draft.nextSteps || ''} onChange={setField('nextSteps')} />
                  <FormActions onCancel={() => setEditing(null)} />
                </form>
              ) : (
                <div className="space-y-5">
                  {keyPoints.length > 0 ? (
                    <BulletList title="Key points" items={keyPoints} dot="bg-gray-400" />
                  ) : summaryText ? (
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{summaryText}</p>
                  ) : (
                    <p className={muted}>No summary available.</p>
                  )}
                  {(concerns.length > 0 || positives.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                      <BulletList title="Concerns" items={concerns} dot="bg-amber-500" renderItem={renderConcern} />
                      <BulletList title="In favour" items={positives} dot="bg-emerald-500" />
                    </div>
                  )}
                  {nextSteps.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60">
                      <BulletList title="Agreed next steps" items={nextSteps} dot="bg-blue-500" />
                    </div>
                  )}
                </div>
              )}
            </Panel>

            <div className="space-y-5">
              <Panel title="Likelihood to go ahead" icon={TrendingUp}>
                {hasChance && tone ? (
                  <>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
                        {chance}%
                      </span>
                      <span className={`text-sm font-medium ${tone.text}`}>{tone.label}</span>
                    </div>
                    <div className="mt-3 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${chance}%` }} />
                    </div>
                    {typeof startChance === 'number' && startChance !== chance && (
                      <p className={`${muted} mt-2`}>
                        Started at {startChance}%, {chance! > startChance ? 'up' : 'down'} {Math.abs(chance! - startChance)} points
                        by the end
                      </p>
                    )}
                    {moments.length > 0 && (
                      <ul className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-2.5">
                        {moments.map((m) => (
                          <li key={m.seconds} className="flex items-start gap-2.5 text-sm">
                            <span
                              className={`shrink-0 w-11 text-xs font-semibold tabular-nums ${
                                m.change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {m.change > 0 ? '▲' : '▼'} {Math.abs(m.change)}
                            </span>
                            <span className="min-w-0 text-gray-700 dark:text-gray-300 leading-snug">
                              {m.reason}{' '}
                              <button
                                onClick={() => jumpToSeconds(m.seconds)}
                                className="text-xs tabular-nums font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                ▸ {m.timestamp}
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className={muted}>No estimate for this recording.</p>
                )}
              </Panel>

              <Panel
                title="Follow-ups"
                icon={CalendarCheck}
                subtitle={recording.tasks.length > 0 ? `${completedTasksCount} of ${recording.tasks.length} done` : undefined}
                action={
                  editingTaskId !== 'new' && (
                    <Button variant="link" onClick={() => setEditingTaskId('new')} className="text-sm">
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  )
                }
              >
                {recording.tasks.length === 0 && editingTaskId !== 'new' && (
                  <p className={muted}>No follow-ups came out of this conversation.</p>
                )}
                <div className="-my-1 divide-y divide-gray-100 dark:divide-gray-700/60">
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
                  {editingTaskId === 'new' && <TaskEditor onSave={handleSaveTask} onCancel={() => setEditingTaskId(null)} />}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {tab === 'pitch' && <PitchReviewCard pitch={recording.pitchAnalysis} onJump={jumpToSeconds} />}

      {tab === 'transcript' && (
        <Panel
          title="Transcript"
          icon={MessageSquare}
          action={
            recording.transcript.length > 0 && (
              <div className="flex items-center gap-2">
                <SearchInput
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Search"
                  aria-label="Search transcript"
                  wrapperClassName="w-40 sm:w-56"
                  className="py-1.5"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingTranscript((prev) => !prev);
                    setEditingSegmentId(null);
                  }}
                >
                  {isEditingTranscript ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  {isEditingTranscript ? 'Done' : 'Edit'}
                </Button>
              </div>
            )
          }
        >
          {filteredTranscript.length === 0 ? (
            <p className={muted}>{recording.transcript.length === 0 ? 'No transcript available.' : 'No matches.'}</p>
          ) : (
            <div ref={transcriptRef} className="relative max-h-[600px] overflow-y-auto pr-1 space-y-1">
              {filteredTranscript.map((segment) => {
                const style = speakerStyles[segment.speaker] || SPEAKER_STYLES[0];
                return (
                  <div
                    key={segment.id}
                    ref={(el) => {
                      segmentRefs.current[segment.id] = el;
                    }}
                    className={`pl-3 pr-2 py-2 border-l-2 rounded-r-md transition-colors ${style.border} ${
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
                          {isEditingTranscript && (
                            <EditButton
                              onClick={() => startSegmentEdit(segment)}
                              label="Edit this line"
                              className="ml-auto self-center -my-1"
                            />
                          )}
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${
                            segment.isUnclear ? 'text-gray-500 dark:text-gray-400 italic' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {segment.text}
                        </p>
                        {segment.translatedText && <p className={`${muted} mt-1 leading-relaxed`}>{segment.translatedText}</p>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
};
