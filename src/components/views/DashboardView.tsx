import React, { useMemo } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  Filter,
  Lightbulb,
  MessagesSquare,
  UserPlus,
  Users,
} from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import { buildConversionOverview, treatmentOf } from '../../utils/conversion';
import { LossReasonsCard } from '../insights/LossReasonsCard';
import { byUrgency, flattenTasks } from '../../utils/tasks';
import {
  Avatar,
  Button,
  Card,
  ColumnChart,
  ConversionBadge,
  EmptyState,
  formatRecordingDate,
  FunnelBars,
  LeadFlagBadge,
  muted,
  PageHeader,
  SectionTitle,
  StageBadge,
  StatTile,
  TaskRow,
} from '../ui';

interface DashboardViewProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onSelectRecording: (recordingId: string) => void;
  onAddPatient: () => void;
  onNavigateToPatients: (clientId?: string) => void;
  onNavigateToFollowUps: () => void;
  onNavigateToInsights: () => void;
  onToggleTaskStatus: (taskId: string) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const DashboardView: React.FC<DashboardViewProps> = ({
  recordings,
  clients,
  onSelectRecording,
  onAddPatient,
  onNavigateToPatients,
  onNavigateToFollowUps,
  onNavigateToInsights,
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
  const lowConversion = useMemo(
    () =>
      scored
        .filter((r) => r.estimatedConversionChance! < 50)
        .sort((a, b) => a.estimatedConversionChance! - b.estimatedConversionChance!),
    [scored]
  );
  const overview = useMemo(() => buildConversionOverview(clients), [clients]);

  // Newest leads first; leads added on the same day are ordered by their latest visit
  const recentLeads = useMemo(
    () =>
      [...clients]
        .sort(
          (a, b) =>
            (b.createdDate || '').localeCompare(a.createdDate || '') ||
            (b.lastVisitDate || '').localeCompare(a.lastVisitDate || '')
        )
        .slice(0, 5),
    [clients]
  );

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

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="How enquiries are converting into procedures.">
        <Button onClick={onAddPatient} className="shrink-0">
          <UserPlus className="w-4 h-4" />
          <span>New patient</span>
        </Button>
      </PageHeader>

      {clients.length === 0 && recordings.length === 0 && (
        <EmptyState
          icon={Users}
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

      {(clients.length > 0 || recordings.length > 0) && (
      <>
      {/* Conversion health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total leads"
          value={String(overview.totalLeads)}
          note={overview.newThisMonth > 0 ? `+${overview.newThisMonth} this month` : 'None new this month'}
          onClick={() => onNavigateToPatients()}
        />
        <StatTile label="Converted leads" value={String(overview.converted)} note="Treatment booked" />
        <StatTile
          label="Conversion rate"
          value={overview.conversionRate === null ? '—' : `${overview.conversionRate}%`}
          note={`${overview.converted} of ${plural(overview.totalLeads, 'lead')}`}
        />
        <StatTile
          label="Lost leads"
          value={String(overview.lost)}
          note={
            overview.lost > 0 ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">Needs review</span>
            ) : (
              'None lost'
            )
          }
        />
      </div>

      {overview.totalLeads > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <Card as="section" className="p-5">
            <SectionTitle icon={BarChart3}>Leads by treatment</SectionTitle>
            <ColumnChart items={overview.byTreatment} unit="lead" />
          </Card>
          <Card as="section" className="p-5">
            <SectionTitle icon={Filter}>Conversion funnel</SectionTitle>
            <FunnelBars steps={overview.funnel} />
            {(overview.onHold > 0 || overview.followUpPending > 0) && (
              <p className={`${muted} mt-4`}>
                {[
                  overview.onHold > 0 && `${overview.onHold} on hold`,
                  overview.followUpPending > 0 && `${overview.followUpPending} follow-up pending`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </Card>
          <LossReasonsCard
            overview={overview}
            action={
              <Button variant="link" onClick={onNavigateToInsights} className="shrink-0">
                Insights <ArrowRight className="w-4 h-4" />
              </Button>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Recent leads */}
        <Card as="section" className="lg:col-span-3 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-4">
            <SectionTitle icon={Users}>Recent leads</SectionTitle>
            {clients.length > 0 && (
              <Button variant="link" onClick={() => onNavigateToPatients()}>
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {recentLeads.length === 0 ? (
            <p className={`${muted} px-5 pb-8 text-center`}>No leads yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850">
                  <th className="py-2.5 pl-5 pr-3 font-medium">Lead</th>
                  <th className="py-2.5 px-3 font-medium">Stage</th>
                  <th className="py-2.5 px-3 font-medium hidden xl:table-cell">Added</th>
                  <th className="py-2.5 px-3 font-medium">Conversion</th>
                  <th className="py-2.5 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onNavigateToPatients(lead.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 pl-5 pr-3 w-full max-w-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{lead.name}</div>
                          <div className={`${muted} truncate`}>{treatmentOf(lead)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <StageBadge stage={lead.stage} />
                        <LeadFlagBadge flag={lead.flag} />
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap hidden xl:table-cell text-gray-600 dark:text-gray-400">
                      {formatRecordingDate(lead.createdDate).date}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <ConversionBadge value={lead.conversionChance} />
                    </td>
                    <td className="py-3.5 pr-4 text-blue-600 dark:text-blue-500">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
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
        {/* <Card as="section" className="lg:col-span-3 p-5">
          <SectionTitle icon={MessagesSquare}>Conversation insights</SectionTitle>
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
        </Card> */}

        {/* Next step */}
        {/* <Card as="section" className="lg:col-span-2 p-5 flex items-center justify-between gap-4">
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
        </Card> */}
      </div>
      </>
      )}
    </div>
  );
};
