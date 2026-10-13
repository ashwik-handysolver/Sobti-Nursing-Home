import React from 'react';
import { LeadStage, TaskPriority } from '../../types/meeting';
import { card } from './styles';

// Screen title with an optional subtitle; children sit on the right (actions, progress, …)
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, className = 'flex items-center justify-between gap-3', children }) => (
  <div className={className}>
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const STAGE_STYLES: Record<string, string> = {
  'New Inquiry': 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
  'Consultation Completed':
    'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60',
  'Surgery Scheduled':
    'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
  'Post-Op Follow-Up':
    'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
};
const STAGE_FALLBACK = 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

export const StageBadge: React.FC<{ stage: LeadStage; shape?: 'pill' | 'tag' }> = ({ stage, shape = 'pill' }) => (
  <span
    className={`inline-block px-2 py-0.5 text-xs font-medium border ${shape === 'pill' ? 'rounded-full' : 'rounded-md'} ${
      STAGE_STYLES[stage] || STAGE_FALLBACK
    }`}
  >
    {stage}
  </span>
);

export const SectionTitle: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({
  icon: Icon,
  children,
}) => (
  <h2 className="flex items-center gap-2.5 text-base font-semibold text-gray-900 dark:text-gray-100">
    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0" />
    <span>{children}</span>
  </h2>
);

export const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, hint, action }) => (
  <div className={`${card} px-6 py-14 flex flex-col items-center text-center`}>
    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6" />
    </div>
    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    {hint && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{hint}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const chanceTone = (value: number) =>
  value >= 75
    ? {
        key: 'high' as const,
        label: 'High',
        text: 'text-emerald-600 dark:text-emerald-400',
        pill: 'bg-emerald-600 text-white',
        bar: 'bg-emerald-500',
      }
    : value >= 50
    ? {
        key: 'moderate' as const,
        label: 'Moderate',
        text: 'text-amber-600 dark:text-amber-400',
        pill: 'bg-amber-600 text-white',
        bar: 'bg-amber-500',
      }
    : {
        key: 'low' as const,
        label: 'Low',
        text: 'text-gray-500 dark:text-gray-400',
        pill: 'bg-gray-500 text-white dark:bg-gray-600',
        bar: 'bg-gray-400 dark:bg-gray-500',
      };

export const ConversionBadge: React.FC<{ value?: number }> = ({ value }) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  const tone = chanceTone(value);
  return (
    <span
      className={`inline-block min-w-[3rem] text-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${tone.pill}`}
      title={`${tone.label} conversion probability`}
    >
      {value}%
    </span>
  );
};

const AVATAR_COLORS = ['bg-blue-600', 'bg-violet-600', 'bg-teal-600', 'bg-rose-500', 'bg-amber-600', 'bg-cyan-600'];

export const Avatar: React.FC<{ name?: string; size?: 'sm' | 'lg' }> = ({ name, size = 'sm' }) => {
  const clean = (name || '').replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').trim();
  const initials = clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const hash = [...clean].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const color = clean ? AVATAR_COLORS[hash % AVATAR_COLORS.length] : 'bg-gray-300 dark:bg-gray-600';
  const dims = size === 'lg' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs';

  return (
    <span
      aria-hidden="true"
      className={`${dims} ${color} rounded-full inline-flex items-center justify-center shrink-0 font-semibold text-white`}
    >
      {initials || '–'}
    </span>
  );
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  High: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  Low: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
};

export const PriorityPill: React.FC<{ priority: TaskPriority }> = ({ priority }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low}`}>
    {priority}
  </span>
);

// "2026-10-10 14:30" -> { date: "Oct 10, 2026", time: "2:30 PM" }
export function formatRecordingDate(value: string): { date: string; time: string } {
  const hasTime = value.length > 10;
  const parsed = new Date(hasTime ? value.replace(' ', 'T') : `${value}T00:00`);
  if (isNaN(parsed.getTime())) return { date: value, time: '' };
  return {
    date: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: hasTime ? parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
  };
}
