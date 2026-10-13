import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  LineChart,
  ListChecks,
  Network,
  ThumbsUp,
} from 'lucide-react';
import { MeetingRecording, TranscriptSegment } from '../../types/meeting';
import { describeDue } from '../../utils/tasks';
import { ConversionTimelineChart } from './ConversionTimelineChart';
import { PitchScorecard } from './PitchReview';
import { Card, chanceTone, muted, SectionTitle } from '../ui';

export interface LinkedConcern {
  text: string;
  segment: TranscriptSegment | null;
}

interface RecordingGraphViewProps {
  recording: MeetingRecording;
  currentTime: number;
  positives: string[];
  concerns: LinkedConcern[];
  keyPoints: string[];
  nextSteps: string[];
  onSeek: (seconds: number) => void;
  onToggleTask: (taskId: string) => void;
}

const formatClock = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const Tile: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Card className="p-4">
    <div className={muted}>{label}</div>
    {children}
  </Card>
);

const Meter: React.FC<{ percent: number; fill: string; label: string }> = ({ percent, fill, label }) => (
  <div
    className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"
    role="meter"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(percent)}
    aria-label={label}
  >
    <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
  </div>
);

export const RecordingGraphView: React.FC<RecordingGraphViewProps> = ({
  recording,
  currentTime,
  positives,
  concerns,
  keyPoints,
  nextSteps,
  onSeek,
  onToggleTask,
}) => {
  const { transcript, tasks } = recording;

  const speakers = useMemo(() => [...new Set(transcript.map((seg) => seg.speaker))], [transcript]);

  // Length of the conversation; falls back to an estimate when the audio length is unknown
  const totalSeconds = useMemo(() => {
    const last = transcript[transcript.length - 1];
    if (!last) return recording.duration || 0;
    const estimatedEnd = last.startSeconds + Math.max(5, wordCount(last.text) / 2.5);
    return Math.max(recording.duration || 0, estimatedEnd);
  }, [transcript, recording.duration]);

  const chance = recording.estimatedConversionChance;
  const hasChance = typeof chance === 'number' && !isNaN(chance);
  const tone = hasChance ? chanceTone(chance!) : null;

  const doneCount = tasks.filter((t) => t.status === 'Completed').length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'Completed' && describeDue(t, recording.uploadDate).urgency === 'overdue'
  ).length;

  const branches = [
    { label: 'In favour', icon: ThumbsUp, tone: 'text-emerald-600 dark:text-emerald-400', items: positives.map((text) => ({ text })) },
    {
      label: 'Concerns',
      icon: AlertTriangle,
      tone: 'text-amber-600 dark:text-amber-400',
      items: concerns.map((c) => ({ text: c.text, seek: c.segment?.startSeconds, stamp: c.segment?.timestamp })),
    },
    { label: 'Key points', icon: ListChecks, tone: 'text-gray-500 dark:text-gray-400', items: keyPoints.map((text) => ({ text })) },
    { label: 'Next steps', icon: ArrowRight, tone: 'text-blue-600 dark:text-blue-400', items: nextSteps.map((text) => ({ text })) },
    {
      label: 'Follow-ups',
      icon: CalendarCheck,
      tone: 'text-violet-600 dark:text-violet-400',
      items: tasks.map((t) => ({
        text: t.description,
        taskId: t.id,
        done: t.status === 'Completed',
        stamp: describeDue(t, recording.uploadDate).label,
      })),
    },
  ].filter((b) => b.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Conversion probability">
          {hasChance && tone ? (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-gray-900 dark:text-gray-100">{chance}%</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{tone.label}</span>
              </div>
              <Meter percent={chance!} fill={tone.bar} label="Conversion probability" />
            </>
          ) : (
            <div className="mt-1 text-2xl font-semibold text-gray-400">—</div>
          )}
        </Tile>

        <Tile label="Signals">
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{positives.length}</span>
              <span>in favour</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{concerns.length}</span>
              <span>{concerns.length === 1 ? 'concern' : 'concerns'}</span>
            </div>
          </div>
        </Tile>

        <Tile label="Follow-ups done">
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
              {doneCount}
              <span className="text-xl text-gray-400">/{tasks.length}</span>
            </span>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                {overdueCount} overdue
              </span>
            )}
          </div>
          <Meter
            percent={tasks.length ? (doneCount / tasks.length) * 100 : 0}
            fill="bg-blue-600 dark:bg-blue-500"
            label="Follow-ups completed"
          />
        </Tile>

        <Tile label="Conversation">
          <div className="mt-1 text-4xl font-semibold text-gray-900 dark:text-gray-100">{formatClock(totalSeconds)}</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {transcript.length} turns · {speakers.length} {speakers.length === 1 ? 'speaker' : 'speakers'}
          </div>
        </Tile>
      </div>

      {/* How the likelihood moved during the conversation */}
      <Card as="section" className="p-5">
        <SectionTitle icon={LineChart}>Conversion over the conversation</SectionTitle>
        {recording.conversionTimeline && recording.conversionTimeline.length >= 2 ? (
          <>
            <p className={`${muted} mt-1`}>
              Estimated likelihood at each turning point. Click anywhere to play from that moment.
            </p>
            <ConversionTimelineChart
              points={recording.conversionTimeline}
              totalSeconds={totalSeconds}
              currentTime={currentTime}
              onSeek={onSeek}
            />
          </>
        ) : (
          <p className={`${muted} mt-2`}>
            Not available for this recording. It was analyzed before this chart existed; use Re-analyze to get one.
          </p>
        )}
      </Card>

      <PitchScorecard pitch={recording.pitchAnalysis} onSeek={onSeek} />

      {/* Everything the analysis found, as a tree */}
      {branches.length > 0 && (
        <Card as="section" className="p-5">
          <SectionTitle icon={Network}>Conversation map</SectionTitle>

          <div className="mt-4 flex flex-col md:flex-row md:items-stretch">
            <div className="md:self-center shrink-0 mb-3 md:mb-0 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold max-w-[14rem]">
              {recording.clientName || recording.title}
            </div>
            <div className="hidden md:block self-center w-6 border-t border-gray-300 dark:border-gray-600" />

            <div className="flex-1 min-w-0">
              {branches.map((branch, bi) => (
                <div key={branch.label} className="relative pl-6 pb-4 last:pb-0">
                  {/* Trunk and the stub into this branch */}
                  <span
                    className={`absolute left-0 w-px bg-gray-300 dark:bg-gray-600 ${
                      bi === 0 ? 'top-4' : 'top-0'
                    } ${bi === branches.length - 1 ? (bi === 0 ? 'h-0' : 'h-4') : 'bottom-0'}`}
                  />
                  <span className="absolute left-0 top-4 w-6 border-t border-gray-300 dark:border-gray-600" />

                  <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-0">
                    <div className="shrink-0 lg:w-36 inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-sm font-medium text-gray-900 dark:text-gray-100 w-fit">
                      <branch.icon className={`w-4 h-4 shrink-0 ${branch.tone}`} />
                      <span>{branch.label}</span>
                      <span className="text-gray-400 tabular-nums">{branch.items.length}</span>
                    </div>
                    <span className="hidden lg:block mt-4 w-5 border-t border-gray-300 dark:border-gray-600 shrink-0" />

                    <ul className="flex-1 min-w-0 flex flex-wrap gap-2">
                      {branch.items.map((item: any, i) => {
                        const interactive = item.seek !== undefined || item.taskId;
                        const body = (
                          <>
                            <span className={`line-clamp-2 text-left ${item.done ? 'line-through text-gray-400' : ''}`}>
                              {item.text}
                            </span>
                            {item.stamp && (
                              <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                                {item.stamp}
                              </span>
                            )}
                          </>
                        );
                        const cls =
                          'max-w-full sm:max-w-[20rem] min-h-8 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200';
                        return (
                          <li key={i} className="max-w-full">
                            {interactive ? (
                              <button
                                onClick={() => (item.taskId ? onToggleTask(item.taskId) : onSeek(item.seek))}
                                title={item.taskId ? `${item.done ? 'Mark as pending' : 'Mark as done'}: ${item.text}` : `Play from ${item.stamp}: ${item.text}`}
                                className={`${cls} hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer`}
                              >
                                {body}
                              </button>
                            ) : (
                              <div className={cls} title={item.text}>
                                {body}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
