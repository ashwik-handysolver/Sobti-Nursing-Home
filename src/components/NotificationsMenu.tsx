import React, { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../types/meeting';
import { byUrgency, flattenTasks } from '../utils/tasks';
import { Button, IconButton, muted, Popover, sectionTitle, TaskRow } from './ui';

interface NotificationsMenuProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onToggleTaskStatus: (taskId: string) => void;
  onOpenRecording: (recordingId: string) => void;
  onViewAll: () => void;
}

// Bell in the top bar: the follow-ups that are due today
export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  recordings,
  clients,
  onToggleTaskStatus,
  onOpenRecording,
  onViewAll,
}) => {
  const { dueToday, overdueCount } = useMemo(() => {
    const pending = flattenTasks(recordings, clients).filter((t) => t.status !== 'Completed');
    return {
      dueToday: pending.filter((t) => t.urgency === 'today').sort(byUrgency),
      overdueCount: pending.filter((t) => t.urgency === 'overdue').length,
    };
  }, [recordings, clients]);

  const label =
    dueToday.length === 0
      ? 'Notifications'
      : `Notifications, ${dueToday.length} follow-up${dueToday.length === 1 ? '' : 's'} due today`;

  return (
    <Popover
      className="w-80"
      trigger={({ isOpen, toggle }) => (
        <IconButton onClick={toggle} aria-label={label} aria-expanded={isOpen} title="Today's follow-ups" className="relative p-2">
          <Bell className="w-5 h-5" />
          {dueToday.length > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-semibold leading-4 text-center tabular-nums">
              {dueToday.length}
            </span>
          )}
        </IconButton>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/60">
            <span className={sectionTitle}>Today's follow-ups</span>
            <span className={`${muted} tabular-nums`}>{dueToday.length} due</span>
          </div>

          {dueToday.length === 0 ? (
            <p className={`${muted} px-4 py-6 text-center`}>Nothing is due today.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto px-4 divide-y divide-gray-100 dark:divide-gray-700/60">
              {dueToday.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  context={task.patientName}
                  due={task.due}
                  onToggle={() => onToggleTaskStatus(task.id)}
                  onOpen={() => {
                    onOpenRecording(task.recordingId);
                    close();
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60">
            <span className={overdueCount > 0 ? 'text-xs font-medium text-rose-600 dark:text-rose-400' : muted}>
              {overdueCount > 0 ? `${overdueCount} overdue` : 'No overdue follow-ups'}
            </span>
            <Button
              variant="link"
              className="text-xs"
              onClick={() => {
                onViewAll();
                close();
              }}
            >
              View all
            </Button>
          </div>
        </>
      )}
    </Popover>
  );
};
