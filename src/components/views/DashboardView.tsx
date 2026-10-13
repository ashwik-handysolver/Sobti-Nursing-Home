import React, { useMemo } from 'react';
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import { byUrgency, flattenTasks } from '../../utils/tasks';
import {
  Avatar,
  Button,
  Card,
  ConversionBadge,
  EmptyState,
  formatRecordingDate,
  muted,
  PageHeader,
  SectionTitle,
  TaskRow,
} from '../ui';

interface DashboardViewProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onSelectRecording: (recordingId: string) => void;
  onAddPatient: () => void;
  onNavigateToRecordings: () => void;
  onNavigateToPatients: (clientId?: string) => void;
  onNavigateToFollowUps: () => void;
  onToggleTaskStatus: (taskId: string) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const DashboardView: React.FC<DashboardViewProps> = ({
  recordings,
  clients,
  onSelectRecording,
  onAddPatient,
  onNavigateToRecordings,
  onNavigateToFollowUps,
  onToggleTaskStatus,
}) => {
  const pendingTasks = useMemo(
    () =>
      flattenTasks(recordings, clients)
        .filter((t) => t.status !== 'Completed')
        .sort(byUrgency),
    [recordings, clients]
  );
  const overdueCount = pendingTasks.filter((t) => t.urgency === 'overdue').length;
  const dueTodayCount = pendingTasks.filter((t) => t.urgency === 'today').length;

  const scored = useMemo(
    () => recordings.filter((r) => typeof r.estimatedConversionChance === 'number'),
    [recordings]
  );
  const avgConversion = scored.length
    ? Math.round(scored.reduce((acc, r) => acc + r.estimatedConversionChance!, 0) / scored.length)
    : null;
  const highCount = scored.filter((r) => r.estimatedConversionChance! >= 75).length;
  const lowConversion = useMemo(
    () =>
      scored
        .filter((r) => r.estimatedConversionChance! < 50)
        .sort((a, b) => a.estimatedConversionChance! - b.estimatedConversionChance!),
    [scored]
  );
  const totalMinutes = Math.round(recordings.reduce((acc, r) => acc + (r.duration || 0), 0) / 60);

  // Most frequent objection category, counted once per conversation
  const topObjection = useMemo(() => {
    const counts = new Map<string, number>();
    recordings.forEach((r) => {
      new Set((r.conversionBarriers || []).map((b) => b.category)).forEach((category) => {
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { category: top[0], count: top[1] } : null;
  }, [recordings]);

  const nextStep =
    overdueCount > 0
      ? { text: `Review ${plural(overdueCount, 'overdue follow-up')}`, run: onNavigateToFollowUps }
      : dueTodayCount > 0
      ? { text: `Complete ${plural(dueTodayCount, 'follow-up')} due today`, run: onNavigateToFollowUps }
      : lowConversion.length > 0
      ? {
          text: `Review ${plural(lowConversion.length, 'low-conversion conversation')}`,
          run: () => onSelectRecording(lowConversion[0].id),
        }
      : pendingTasks.length > 0
      ? { text: `Work through ${plural(pendingTasks.length, 'pending follow-up')}`, run: onNavigateToFollowUps }
      : { text: 'Add a new patient and upload their recording', run: onAddPatient };

  const stats = [
    {
      label: 'Analyzed recordings',
      value: String(recordings.length),
      note: <span>{totalMinutes} min of audio</span>,
      icon: AudioLines,
      iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
      onClick: onNavigateToRecordings,
    },
    {
      label: 'Pending follow-ups',
      value: String(pendingTasks.length),
      note:
        overdueCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {overdueCount} overdue
          </span>
        ) : dueTodayCount > 0 ? (
          <span className="font-medium text-amber-600 dark:text-amber-400">{dueTodayCount} due today</span>
        ) : (
          <span>None overdue</span>
        ),
      icon: CalendarCheck,
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
      onClick: onNavigateToFollowUps,
    },
    {
      label: 'Avg. conversion outlook',
      value: avgConversion === null ? '—' : `${avgConversion}%`,
      note:
        avgConversion === null ? (
          <span>No estimates yet</span>
        ) : (
          <span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{highCount}</span> high likelihood
          </span>
        ),
      icon: TrendingUp,
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your conversations, insights, and next steps.">
        <Button onClick={onAddPatient} className="shrink-0">
          <UserPlus className="w-4 h-4" />
          <span>New patient</span>
        </Button>
      </PageHeader>

      {recordings.length === 0 && (
        <EmptyState
          icon={AudioLines}
          title="Add your first patient"
          hint="Upload their consultation recording as you add them to get a summary, follow-ups, a conversion estimate and the transcript."
          action={
            <Button onClick={onAddPatient}>
              <UserPlus className="w-4 h-4" />
              <span>New patient</span>
            </Button>
          }
        />
      )}

      {recordings.length > 0 && (
      <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            onClick={stat.onClick} className={`p-5 flex items-center gap-4 ${
              stat.onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors' : ''
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.iconClass}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
                {stat.value}
              </div>
              <div className={`${muted} mt-0.5`}>{stat.note}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Recent recordings */}
        <Card as="section" className="lg:col-span-3 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-4">
            <SectionTitle icon={AudioLines}>Recent recordings</SectionTitle>
            {recordings.length > 0 && (
              <Button variant="link" onClick={onNavigateToRecordings}>
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {recordings.length === 0 ? (
            <p className={`${muted} px-5 pb-8 text-center`}>No recordings yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850">
                  <th className="py-2.5 pl-5 pr-3 font-medium">Patient</th>
                  <th className="py-2.5 px-3 font-medium">Recording</th>
                  <th className="py-2.5 px-3 font-medium hidden xl:table-cell">Date</th>
                  <th className="py-2.5 px-3 font-medium">Conversion</th>
                  <th className="py-2.5 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                {recordings.slice(0, 5).map((rec) => {
                  const when = formatRecordingDate(rec.uploadDate);
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onSelectRecording(rec.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={rec.clientName} />
                          <span className="hidden sm:inline text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {rec.clientName || <span className="text-gray-400">Not linked</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 w-full max-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{rec.title}</div>
                        <div className={`${muted} truncate xl:hidden`}>
                          <span className="sm:hidden">{rec.clientName ? `${rec.clientName} · ` : ''}</span>
                          {when.date}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap hidden xl:table-cell">
                        <div className="text-gray-900 dark:text-gray-100">{when.date}</div>
                        {when.time && <div className={muted}>{when.time}</div>}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <ConversionBadge value={rec.estimatedConversionChance} />
                      </td>
                      <td className="py-3.5 pr-4 text-blue-600 dark:text-blue-500">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Follow-ups */}
        <Card as="section" className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1">
            <SectionTitle icon={CalendarCheck}>Follow-ups to review</SectionTitle>
            {pendingTasks.length > 0 && (
              <Button variant="link" onClick={onNavigateToFollowUps} className="shrink-0">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {pendingTasks.length === 0 ? (
            <p className={`${muted} py-6 text-center`}>Nothing pending.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/70">
              {pendingTasks.slice(0, 4).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  context={task.patientName}
                  due={task.due}
                  onToggle={() => onToggleTaskStatus(task.id)}
                  onOpen={() => onSelectRecording(task.recordingId)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Conversation insights */}
        <Card as="section" className="lg:col-span-3 p-5">
          <SectionTitle icon={BarChart3}>Conversation insights</SectionTitle>
          {topObjection ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Common objection:</span>{' '}
                {topObjection.category}
              </p>
              <div className="mt-2.5 flex items-center gap-4">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.round((topObjection.count / recordings.length) * 100)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {topObjection.count} of {plural(recordings.length, 'conversation')}
                </span>
              </div>
            </>
          ) : (
            <p className={`${muted} mt-3`}>No objections detected yet.</p>
          )}
        </Card>

        {/* Next step */}
        <Card as="section" className="lg:col-span-2 p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <SectionTitle icon={Lightbulb}>Next step</SectionTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{nextStep.text}</p>
          </div>
          <button
            onClick={nextStep.run}
            className="w-11 h-11 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label={nextStep.text}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </Card>
      </div>
      </>
      )}
    </div>
  );
};
