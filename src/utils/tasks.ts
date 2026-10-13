import { ClientLead, MeetingRecording, MeetingTask } from '../types/meeting';

export type Urgency = 'overdue' | 'today' | 'upcoming' | 'none';

export interface DueInfo {
  iso: string | null; // resolved calendar date, when one can be worked out
  urgency: Urgency;
  label: string; // what to show; empty when there is no deadline
}

export interface PatientTask extends MeetingTask {
  recordingId: string;
  recordingTitle: string;
  patientName: string;
  clientId?: string;
  urgency: Urgency;
  due: DueInfo;
}

const URGENCY_ORDER: Record<Urgency, number> = { overdue: 0, today: 1, upcoming: 2, none: 3 };
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fromISO = (iso: string) => new Date(`${iso}T00:00`);

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

export const todayISO = () => toISO(new Date());

export const hasDueDate = (dueDate?: string) =>
  Boolean(dueDate && dueDate.trim() && !dueDate.toLowerCase().includes('not specified'));

// Turns spoken deadlines ("Thursday, 8:00 AM", "in 3 weeks") into a calendar date,
// counted from the day the conversation was recorded. Returns null when it can't.
export function resolveDueISO(text?: string, baseDate?: string): string | null {
  if (!hasDueDate(text)) return null;
  const iso = text!.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];

  const d = text!.toLowerCase();
  if (/daily|nightly|ongoing|prior to|before |after /.test(d)) return null;

  const parsedBase = baseDate ? fromISO(baseDate.substring(0, 10)) : new Date();
  const base = isNaN(parsedBase.getTime()) ? new Date() : parsedBase;

  if (d.includes('today') || d.includes('tonight')) return toISO(base);
  if (d.includes('tomorrow')) return toISO(addDays(base, 1));
  if (d.includes('yesterday')) return toISO(addDays(base, -1));

  const relative = d.match(/in (\d+|a|an|one|two|three|four|five|six) (day|week|month)s?/);
  if (relative) {
    const count = NUMBER_WORDS[relative[1]] ?? parseInt(relative[1], 10);
    const unit = relative[2] === 'day' ? 1 : relative[2] === 'week' ? 7 : 30;
    return toISO(addDays(base, count * unit));
  }
  if (d.includes('next week')) return toISO(addDays(base, 7));

  const monthDay =
    d.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})/) ||
    d.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  if (monthDay) {
    const monthToken = isNaN(Number(monthDay[1])) ? monthDay[1] : monthDay[2];
    const dayToken = isNaN(Number(monthDay[1])) ? monthDay[2] : monthDay[1];
    const candidate = new Date(base.getFullYear(), MONTHS.indexOf(monthToken), parseInt(dayToken, 10));
    // A date well before the conversation means the speaker meant next year
    if (candidate.getTime() < addDays(base, -60).getTime()) candidate.setFullYear(candidate.getFullYear() + 1);
    return toISO(candidate);
  }

  const weekday = WEEKDAYS.findIndex((name) => d.includes(name));
  if (weekday >= 0) {
    return toISO(addDays(base, (weekday - base.getDay() + 7) % 7));
  }
  return null;
}

export function formatDueLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === toISO(addDays(new Date(), 1))) return 'Tomorrow';
  if (iso === toISO(addDays(new Date(), -1))) return 'Yesterday';
  const date = fromISO(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function describeDue(task: MeetingTask, baseDate?: string): DueInfo {
  const iso = task.dueDateISO || resolveDueISO(task.dueDate, baseDate);
  if (!iso) {
    return { iso: null, urgency: 'none', label: hasDueDate(task.dueDate) ? task.dueDate : '' };
  }
  const today = todayISO();
  const time = (task.dueDate || '').match(/\d{1,2}(:\d{2})?\s?(am|pm)/i);
  return {
    iso,
    urgency: iso < today ? 'overdue' : iso === today ? 'today' : 'upcoming',
    label: formatDueLabel(iso) + (time ? `, ${time[0].toUpperCase()}` : ''),
  };
}

export function flattenTasks(recordings: MeetingRecording[], clients: ClientLead[]): PatientTask[] {
  return recordings.flatMap((r) =>
    r.tasks.map((t) => {
      const client = clients.find((c) => c.id === t.clientId || c.recordingIds?.includes(r.id));
      const due = describeDue(t, r.uploadDate);
      return {
        ...t,
        recordingId: r.id,
        recordingTitle: r.title,
        patientName: client?.name || r.clientName || '',
        clientId: client?.id,
        urgency: due.urgency,
        due,
      };
    })
  );
}

export const byUrgency = (a: PatientTask, b: PatientTask) =>
  URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || (a.due.iso || '').localeCompare(b.due.iso || '');
