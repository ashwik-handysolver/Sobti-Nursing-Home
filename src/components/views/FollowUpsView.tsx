import React, { useState, useMemo } from 'react';
import { CalendarDays, PartyPopper } from 'lucide-react';
import { ClientLead, MeetingRecording, MeetingTask } from '../../types/meeting';
import { byUrgency, flattenTasks, PatientTask } from '../../utils/tasks';
import { TaskEditor } from '../TaskEditor';
import { Card, EmptyState, muted, PageHeader, SearchInput, TabOption, Tabs, TaskRow } from '../ui';

interface FollowUpsViewProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onToggleTaskStatus: (taskId: string) => void;
  onOpenRecording: (recordingId: string) => void;
  onUpdateRecordingTasks: (recordingId: string, updatedTasks: MeetingTask[]) => void;
  onOpenPatient?: (patientId: string) => void;
}

type View = 'overdue' | 'today' | 'upcoming' | 'done';

const EMPTY_TEXT: Record<View, string> = {
  overdue: 'Nothing overdue.',
  today: 'Nothing due today.',
  upcoming: 'No upcoming follow-ups.',
  done: 'No follow-ups have been completed yet.',
};

// "Upcoming" also holds follow-ups without a due date, after the dated ones
const belongsTo = (task: PatientTask, view: View) =>
  view === 'done'
    ? task.status === 'Completed'
    : task.status !== 'Completed' &&
      (view === 'upcoming' ? task.urgency === 'upcoming' || task.urgency === 'none' : task.urgency === view);

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  recordings,
  clients,
  onToggleTaskStatus,
  onOpenRecording,
  onUpdateRecordingTasks,
}) => {
  const allTasks = useMemo(() => flattenTasks(recordings, clients).sort(byUrgency), [recordings, clients]);
  const countOf = (view: View) => allTasks.filter((t) => belongsTo(t, view)).length;

  // Open on the most pressing list that has something in it
  const [view, setView] = useState<View>(() =>
    (['overdue', 'today', 'upcoming'] as View[]).find((v) => allTasks.some((t) => belongsTo(t, v))) || 'upcoming'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allTasks.filter(
      (t) =>
        belongsTo(t, view) &&
        (!q ||
          t.description.toLowerCase().includes(q) ||
          t.owner.toLowerCase().includes(q) ||
          t.patientName.toLowerCase().includes(q))
    );
  }, [allTasks, view, searchQuery]);

  const recordingTasks = (recordingId: string) => recordings.find((r) => r.id === recordingId)?.tasks || [];
  const pending = allTasks.filter((t) => t.status !== 'Completed');

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

  const tabs: TabOption<View>[] = [
    { id: 'overdue', label: 'Overdue', badge: countOf('overdue') || undefined },
    { id: 'today', label: 'Today', badge: countOf('today') || undefined },
    { id: 'upcoming', label: 'Upcoming', badge: countOf('upcoming') || undefined },
    { id: 'done', label: 'Done', badge: countOf('done') || undefined },
  ];

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Follow-ups"
        subtitle={
          pending.length === 0
            ? 'Everything is done.'
            : `${pending.length} pending across ${new Set(pending.map((t) => t.clientId || t.patientName)).size} patients`
        }
        className="flex flex-col md:flex-row md:items-end justify-between gap-3"
      >
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search follow-ups or patients"
          aria-label="Search follow-ups"
          wrapperClassName="w-full md:w-80"
        />
      </PageHeader>

      <Card className="overflow-hidden">
        <Tabs<View> value={view} onChange={setView} options={tabs} aria-label="Follow-ups by due date" className="px-3" />

        {tasks.length === 0 ? (
          pending.length === 0 && view !== 'done' ? (
            <div className="p-5">
              <EmptyState icon={PartyPopper} title="All caught up" hint="Every follow-up has been completed." />
            </div>
          ) : (
            <p className={`${muted} px-5 py-10 text-center`}>{searchQuery ? 'No follow-ups match your search.' : EMPTY_TEXT[view]}</p>
          )
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {tasks.map((task) => (
              <div key={task.id} className="px-5">
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
                    context={task.patientName}
                    avatarName={task.patientName}
                    due={task.due}
                    onToggle={() => onToggleTaskStatus(task.id)}
                    onOpen={() => onOpenRecording(task.recordingId)}
                    onEdit={() => setEditingTaskId(task.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
