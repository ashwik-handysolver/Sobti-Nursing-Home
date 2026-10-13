import React from 'react';
import { Calendar, CheckSquare, Pencil, Square } from 'lucide-react';
import { MeetingTask } from '../../types/meeting';
import { DueInfo, describeDue } from '../../utils/tasks';
import { IconButton } from './Button';
import { Avatar, PriorityPill } from './display';
import { muted } from './styles';

interface TaskRowProps {
  task: MeetingTask;
  context?: string; // e.g. patient name
  avatarName?: string; // shows the patient avatar beside the checkbox
  due?: DueInfo;
  onToggle: () => void;
  onOpen?: () => void;
  onEdit?: () => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, context, avatarName, due, onToggle, onOpen, onEdit }) => {
  const done = task.status === 'Completed';
  const dueInfo = due || describeDue(task);
  // Skip the owner when it is unassigned or just repeats the patient ("Patient (Ramesh Patel)")
  const showOwner = task.owner && task.owner !== 'Unassigned' && !(context && task.owner.includes(context));
  const meta = [context, showOwner ? task.owner : null].filter(Boolean).join(' · ');
  const dueTone =
    !done && dueInfo.urgency === 'overdue'
      ? 'text-rose-600 dark:text-rose-400 font-medium'
      : !done && dueInfo.urgency === 'today'
      ? 'text-amber-600 dark:text-amber-400 font-medium'
      : 'text-gray-500 dark:text-gray-400';
  const titleClass = `text-sm font-medium leading-snug text-left ${
    done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
  }`;

  return (
    <div className="@container">
    <div className="group flex flex-wrap @md:flex-nowrap items-start gap-x-3 gap-y-1.5 py-3">
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        aria-label={done ? 'Mark as pending' : 'Mark as done'}
      >
        {done ? <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Square className="w-5 h-5" />}
      </button>

      {avatarName !== undefined && <Avatar name={avatarName} />}

      <div className="min-w-0 flex-1">
        {onOpen ? (
          <button onClick={onOpen} className={`${titleClass} hover:underline cursor-pointer`} title="Open recording">
            {task.description}
          </button>
        ) : (
          <p className={titleClass}>{task.description}</p>
        )}
        {meta && <p className={`${muted} mt-1`}>{meta}</p>}
      </div>

      <div className="order-3 @md:order-2 basis-full @md:basis-auto pl-8 @md:pl-0 shrink-0 flex flex-row-reverse @md:flex-col justify-end items-center @md:items-end gap-2 @md:gap-1.5 @md:max-w-[9.5rem]">
        {!done && <PriorityPill priority={task.priority} />}
        {dueInfo.label && (
          <span className={`inline-flex items-start gap-1 text-xs text-right ${dueTone}`}>
            <Calendar className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>{dueInfo.label}</span>
          </span>
        )}
      </div>

      {onEdit && (
        <IconButton
          onClick={onEdit}
          className="order-2 @md:order-3 shrink-0 -mr-1 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          title="Edit follow-up"
          aria-label="Edit follow-up"
        >
          <Pencil className="w-4 h-4" />
        </IconButton>
      )}
    </div>
    </div>
  );
};
