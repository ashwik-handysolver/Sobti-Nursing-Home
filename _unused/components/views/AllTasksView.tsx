import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { MeetingRecording, MeetingTask, TaskStatus } from '../../types/meeting';

interface AllTasksViewProps {
  recordings: MeetingRecording[];
  onToggleTaskStatus: (taskId: string) => void;
  onOpenRecording: (recordingId: string) => void;
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  recordings,
  onToggleTaskStatus,
  onOpenRecording,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Flatten all tasks
  const allTasks = useMemo(() => {
    return recordings.flatMap((r) =>
      r.tasks.map((t) => ({
        ...t,
        recordingTitle: r.title,
        recordingId: r.id,
      }))
    );
  }, [recordings]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const matchSearch =
        !searchQuery.trim() ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.recordingTitle?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [allTasks, searchQuery, statusFilter, priorityFilter]);

  const completedCount = allTasks.filter((t) => t.status === 'Completed').length;
  const totalCount = allTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Global Action Items Matrix ({allTasks.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aggregated tasks across all audio recordings with verified ownership & deadlines.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <span className="text-slate-500">Global Progress:</span>
          <span className="text-emerald-600 font-bold">{completedCount} / {totalCount} ({percent}%)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action item, owner, or meeting title..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4 min-w-[240px]">Task Description</th>
                <th className="py-3 px-4 min-w-[140px]">Meeting Source</th>
                <th className="py-3 px-4 min-w-[110px]">Assignee</th>
                <th className="py-3 px-4 min-w-[90px]">Priority</th>
                <th className="py-3 px-4 min-w-[130px]">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching action items found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isDone = task.status === 'Completed';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isDone ? 'bg-slate-50/30 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleTaskStatus(task.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Toggle Status"
                        >
                          {task.status === 'Completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                          ) : task.status === 'In Progress' ? (
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <p
                          className={`font-medium text-slate-900 dark:text-slate-100 ${
                            isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {task.description}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {task.recordingId && (
                          <button
                            onClick={() => onOpenRecording(task.recordingId!)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[180px] cursor-pointer"
                            title="Open meeting recording"
                          >
                            <span className="truncate">{task.recordingTitle}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                          <User className="w-3 h-3 text-slate-400" />
                          {task.owner}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : task.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
