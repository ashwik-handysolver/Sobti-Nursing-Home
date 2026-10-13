import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { MeetingTask, TaskPriority } from '../types/meeting';
import { Button, Dropdown, DropdownOption, IconButton, TextInput } from './ui';

const PRIORITY_OPTIONS: DropdownOption<TaskPriority>[] = [
  { value: 'High', label: 'High priority' },
  { value: 'Medium', label: 'Medium priority' },
  { value: 'Low', label: 'Low priority' },
];

export type TaskDraft = Pick<MeetingTask, 'description' | 'owner' | 'priority' | 'dueDate' | 'dueDateISO' | 'isExplicitDeadline'>;

interface TaskEditorProps {
  task?: MeetingTask; // omitted when adding a new follow-up
  initialDueISO?: string | null;
  onSave: (draft: TaskDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({ task, initialDueISO, onSave, onCancel, onDelete }) => {
  const [description, setDescription] = useState(task?.description || '');
  const [owner, setOwner] = useState(task && task.owner !== 'Unassigned' ? task.owner : '');
  const [dueISO, setDueISO] = useState(task?.dueDateISO || initialDueISO || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    // Keep the spoken wording ("Thursday, 8:00 AM") unless the date itself was changed
    const dateChanged = dueISO !== (task?.dueDateISO || initialDueISO || '');
    onSave({
      description: description.trim(),
      owner: owner.trim() || 'Unassigned',
      priority,
      dueDateISO: dueISO || undefined,
      dueDate: dateChanged || !task ? dueISO || 'Not specified' : task.dueDate,
      isExplicitDeadline: dateChanged || !task ? Boolean(dueISO) : task.isExplicitDeadline,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="py-3 space-y-2.5">
      <TextInput
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What needs to happen?"
        aria-label="Follow-up description"
        autoFocus
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <TextInput
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Owner"
          aria-label="Owner"
        />
        <TextInput
          type="date"
          value={dueISO}
          onChange={(e) => setDueISO(e.target.value)}
          aria-label="Due date"
        />
        <Dropdown<TaskPriority> value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} aria-label="Priority" />
      </div>
      <div className="flex items-center justify-between">
        {onDelete ? (
          <IconButton
            tone="danger"
            type="button"
            onClick={onDelete}
            title="Delete follow-up"
            aria-label="Delete follow-up"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};
