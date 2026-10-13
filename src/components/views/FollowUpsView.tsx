import React, { useState, useMemo } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Inbox, PartyPopper } from 'lucide-react';
import { ClientLead, MeetingRecording, MeetingTask } from '../../types/meeting';
import { PatientTask, Urgency, byUrgency, flattenTasks } from '../../utils/tasks';
import { TaskEditor } from '../TaskEditor';
import {
  Avatar,
  Button,
  card,
  Card,
  EmptyState,
  muted,
  PageHeader,
  SearchInput,
  SegmentedControl,
  SegmentOption,
  TaskRow,
} from '../ui';

interface FollowUpsViewProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onToggleTaskStatus: (taskId: string) => void;
  onOpenRecording: (recordingId: string) => void;
  onUpdateRecordingTasks: (recordingId: string, updatedTasks: MeetingTask[]) => void;
  onOpenPatient?: (patientId: string) => void;
}

type Filter = 'pending' | 'overdue' | 'today' | 'upcoming' | 'done';
type GroupBy = 'date' | 'patient';

const GROUP_OPTIONS: SegmentOption<GroupBy>[] = [
  { id: 'date', label: 'By due date' },
  { id: 'patient', label: 'By patient' },
];

const URGENCY_STYLES: Record<Urgency, { label: string; icon: React.ElementType; chip: string; bar: string }> = {
  overdue: {
    label: 'Overdue',
    icon: AlertTriangle,
    chip: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
  today: {
    label: 'Today',
    icon: Clock,
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  upcoming: {
    label: 'Upcoming',
    icon: CalendarDays,
    chip: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    bar: 'bg-blue-500',
  },
  none: {
    label: 'No due date',
    icon: Inbox,
    chip: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    bar: 'bg-gray-300 dark:bg-gray-600',
  },
};

const URGENCY_ORDER: Urgency[] = ['overdue', 'today', 'upcoming', 'none'];

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  recordings,
  clients,
  onToggleTaskStatus,
  onOpenRecording,
  onUpdateRecordingTasks,
  onOpenPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const allTasks = useMemo(() => flattenTasks(recordings, clients).sort(byUrgency), [recordings, clients]);
  const pending = allTasks.filter((t) => t.status !== 'Completed');
  const doneCount = allTasks.length - pending.length;
  const countOf = (urgency: Urgency) => pending.filter((t) => t.urgency === urgency).length;
  const donePercent = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allTasks.filter((t) => {
      const isDone = t.status === 'Completed';
      const matchFilter =
        filter === 'done' ? isDone : !isDone && (filter === 'pending' || t.urgency === filter);
      const matchSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q) ||
        t.patientName.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [allTasks, searchQuery, filter]);

  const recordingTasks = (recordingId: string) => recordings.find((r) => r.id === recordingId)?.tasks || [];

  const renderList = (tasks: PatientTask[], showPatient: boolean) => (
    <Card className="overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
      {tasks.map((task) => (
        <div key={task.id} className="relative pl-5 pr-4">
          {/* Urgency accent */}
          <span
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              task.status === 'Completed' ? 'bg-emerald-500' : URGENCY_STYLES[task.urgency].bar
            }`}
          />
          {editingTaskId === task.id ? (
            <TaskEditor
              task={task}
              initialDueISO={task.due.iso}
              onCancel={() => setEditingTaskId(null)}
              onSave={(draft) => {
                onUpdateRecordingTasks(
                  task.recordingId,
                  recordingTasks(task.recordingId).map((t) => (t.id === task.id ? { ...t, ...draft } : t))
                );
                setEditingTaskId(null);
              }}
              onDelete={() => {
                onUpdateRecordingTasks(
                  task.recordingId,
                  recordingTasks(task.recordingId).filter((t) => t.id !== task.id)
                );
                setEditingTaskId(null);
              }}
            />
          ) : (
            <TaskRow
              task={task}
              context={showPatient ? task.patientName : undefined}
              avatarName={showPatient ? task.patientName : undefined}
              due={task.due}
              onToggle={() => onToggleTaskStatus(task.id)}
              onOpen={() => onOpenRecording(task.recordingId)}
              onEdit={() => setEditingTaskId(task.id)}
            />
          )}
        </div>
      ))}
    </Card>
  );

  const tiles: { id: Filter; label: string; value: number; icon: React.ElementType; chip: string }[] = [
    { id: 'overdue', value: countOf('overdue'), ...URGENCY_STYLES.overdue },
    { id: 'today', label: 'Due today', value: countOf('today'), icon: Clock, chip: URGENCY_STYLES.today.chip },
    { id: 'upcoming', value: countOf('upcoming'), ...URGENCY_STYLES.upcoming },
    {
      id: 'done',
      label: 'Done',
      value: doneCount,
      icon: CheckCircle2,
      chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
  ];

  // Groups for the current view
  const dateGroups = URGENCY_ORDER.map((urgency) => ({
    urgency,
    tasks: filteredTasks.filter((t) => t.urgency === urgency),
  })).filter((g) => g.tasks.length > 0);

  const patientGroups = useMemo(() => {
    const map = new Map<string, { name: string; clientId?: string; tasks: PatientTask[] }>();
    filteredTasks.forEach((t) => {
      const key = t.clientId || t.patientName || '';
      if (!map.has(key)) map.set(key, { name: t.patientName, clientId: t.clientId, tasks: [] });
      map.get(key)!.tasks.push(t);
    });
    return [...map.values()];
  }, [filteredTasks]);

  if (allTasks.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Follow-ups" />
        <EmptyState
          icon={CalendarDays}
          title="No follow-ups yet"
          hint="Follow-ups are pulled out of each recording automatically once it has been analyzed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <PageHeader
        title="Follow-ups"
        subtitle={
          pending.length === 0
            ? 'Everything is done.'
            : `${pending.length} pending across ${new Set(pending.map((t) => t.clientId || t.patientName)).size} patients`
        }
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
      >

        {/* Overall progress */}
        <div className="w-full sm:w-64">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {doneCount} of {allTasks.length} done
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{donePercent}%</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${donePercent}%` }} />
          </div>
        </div>
      </PageHeader>

      {/* Clickable summary tiles double as filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const active = filter === tile.id;
          return (
            <button
              key={tile.id}
              onClick={() => setFilter(active ? 'pending' : tile.id)}
              aria-pressed={active}
              className={`${card} p-4 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                active
                  ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                  : 'hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tile.chip}`}>
                <tile.icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {tile.value}
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">{tile.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search follow-ups"
          aria-label="Search follow-ups"
        />

        <SegmentedControl<GroupBy>
          value={groupBy}
          onChange={setGroupBy}
          options={GROUP_OPTIONS}
          aria-label="Group by"
          className="shrink-0 w-fit"
        />
      </div>

      {filteredTasks.length === 0 ? (
        searchQuery || filter !== 'pending' ? (
          <Card className="py-10 text-center">
            <p className={muted}>Nothing here.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilter('pending');
              }}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Show all pending
            </button>
          </Card>
        ) : (
          <EmptyState icon={PartyPopper} title="All caught up" hint="Every follow-up has been completed." />
        )
      ) : groupBy === 'patient' ? (
        patientGroups.map((group) => (
          <section key={group.clientId || group.name || 'unlinked'} className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Avatar name={group.name} />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.name || 'Not linked to a patient'}</h2>
              <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {group.tasks.length}
              </span>
              {group.clientId && onOpenPatient && (
                <Button variant="link" onClick={() => onOpenPatient(group.clientId!)} className="ml-auto text-xs">
                  View patient
                </Button>
              )}
            </div>
            {renderList(group.tasks, false)}
          </section>
        ))
      ) : filter === 'done' ? (
        renderList(filteredTasks, true)
      ) : (
        dateGroups.map(({ urgency, tasks }) => {
          const style = URGENCY_STYLES[urgency];
          return (
            <section key={urgency} className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center ${style.chip}`}>
                  <style.icon className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{style.label}</h2>
                <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {tasks.length}
                </span>
              </div>
              {renderList(tasks, true)}
            </section>
          );
        })
      )}
    </div>
  );
};
