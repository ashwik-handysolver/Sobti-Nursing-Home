import React from 'react';
import { Clock, PauseCircle, MicOff } from 'lucide-react';
import { LeadFlag, LeadStage, TaskPriority } from '../../types/meeting';
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

const STAGE_DOTS: Record<string, string> = {
  'New Lead': 'bg-blue-500',
  Contacted: 'bg-sky-500',
  'Consultation Booked': 'bg-indigo-500',
  'Consultation Completed': 'bg-violet-500',
  Converted: 'bg-emerald-500',
  Lost: 'bg-rose-500',
};

export const StageBadge: React.FC<{ stage: LeadStage; shape?: 'pill' | 'tag' }> = ({ stage, shape = 'pill' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-200 ${
      shape === 'pill' ? 'rounded-full' : 'rounded-md'
    }`}
  >
    <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${STAGE_DOTS[stage] || 'bg-gray-400'}`} />
    {stage}
  </span>
);

const FLAG_STYLES: Record<LeadFlag, { icon: React.ElementType; className: string }> = {
  'On Hold': { icon: PauseCircle, className: 'text-gray-600 dark:text-gray-300' },
  'Follow-up Pending': { icon: Clock, className: 'text-amber-700 dark:text-amber-400' },
};

// Shows that a lead is on hold or waiting on a follow-up; renders nothing when it is neither
export const LeadFlagBadge: React.FC<{ flag?: LeadFlag }> = ({ flag }) => {
  if (!flag) return null;
  const { icon: Icon, className } = FLAG_STYLES[flag];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {flag}
    </span>
  );
};

// Marks a lead whose consultation has not been recorded yet
export const NoRecordingBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title="No consultation recording yet"
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 ${className}`}
  >
    <MicOff className="w-3 h-3" aria-hidden="true" />
    No recording
  </span>
);

export const SectionTitle: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({
  icon: Icon,
  children,
}) => (
  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
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
        pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
        bar: 'bg-emerald-500',
      }
    : value >= 50
    ? {
        key: 'moderate' as const,
        label: 'Moderate',
        text: 'text-amber-600 dark:text-amber-400',
        pill: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
        bar: 'bg-amber-500',
      }
    : {
        key: 'low' as const,
        label: 'Low',
        text: 'text-gray-500 dark:text-gray-400',
        pill: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/15 dark:bg-gray-700/60 dark:text-gray-300',
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
