import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  CalendarCheck,
  Filter,
  PhoneCall,
  Scale,
  Target,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import { buildConversionOverview, compareTreatments, leadsInPeriod, PERIOD_OPTIONS, PeriodId } from '../../utils/conversion';
import { formatINR } from '../../utils/format';
import { usePeriod } from '../../utils/usePeriod';
import { rankPriorityLeads, STALE_AFTER_DAYS, staleLeads } from '../../utils/priority';
import { byUrgency, flattenTasks } from '../../utils/tasks';
import { LossReasonsCard } from '../insights/LossReasonsCard';
import { PriorityList } from '../dashboard/PriorityList';
import {
  Button,
  EmptyState,
  FunnelSteps,
  MeterList,
  muted,
  PageHeader,
  Panel,
  SegmentedControl,
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
  const [period, changePeriod] = usePeriod();

  // The numbers and charts cover leads that came in during the period;
  // who to call and what is due are always about right now
  const periodLeads = useMemo(() => leadsInPeriod(clients, period), [clients, period]);
  const overview = useMemo(() => buildConversionOverview(periodLeads), [periodLeads]);
  const byTreatment = useMemo(() => compareTreatments(periodLeads).slice(0, 5), [periodLeads]);
  const priority = useMemo(() => rankPriorityLeads(clients, recordings), [clients, recordings]);
  const stale = useMemo(() => staleLeads(clients, recordings), [clients, recordings]);

  const pendingTasks = useMemo(
    () => flattenTasks(recordings, clients).filter((t) => t.status !== 'Completed').sort(byUrgency),
    [recordings, clients]
  );
  const overdueCount = pendingTasks.filter((t) => t.urgency === 'overdue').length;
  const dueNow = pendingTasks.filter((t) => t.urgency === 'overdue' || t.urgency === 'today');
  const shownTasks = (dueNow.length > 0 ? dueNow : pendingTasks).slice(0, 5);

  if (clients.length === 0 && recordings.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={Users}
          title="Add your first patient"
          hint="Add a patient and record or upload their consultation to see who is likely to convert, why leads are lost, and who to call next."
          action={
            <Button onClick={onAddPatient}>
              <UserPlus className="w-4 h-4" />
              <span>New patient</span>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Dashboard"
        className="flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <SegmentedControl<PeriodId> value={period} onChange={changePeriod} options={PERIOD_OPTIONS} aria-label="Period" />
          <Button onClick={onAddPatient} className="shrink-0">
            <UserPlus className="w-4 h-4" />
            <span>New patient</span>
          </Button>
        </div>
      </PageHeader>

      {/* What needs attention, in one line */}
      {(stale.length > 0 || overdueCount > 0) && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-sm text-gray-800 dark:text-gray-200"
        >
          <AlertTriangle className="hidden sm:block w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="flex-1 min-w-0">
            {stale.length > 0 && (
              <>
                <span className="font-semibold">{plural(stale.length, 'open lead')}</span> without contact for{' '}
                {STALE_AFTER_DAYS}+ days
                {stale.length <= 3 && (
                  <>
                    :{' '}
                    {stale.map(({ client }, i) => (
                      <React.Fragment key={client.id}>
                        {i > 0 && ', '}
                        <button
                          onClick={() => onNavigateToPatients(client.id)}
                          className="underline decoration-amber-400 underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer"
                        >
                          {client.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </>
                )}
                {overdueCount > 0 && '. '}
              </>
            )}
            {overdueCount > 0 && (
              <>
                <span className="font-semibold">{plural(overdueCount, 'follow-up')}</span> overdue.
              </>
            )}
          </p>
          {overdueCount > 0 && (
            <Button variant="link" onClick={onNavigateToFollowUps} className="shrink-0 text-amber-800! dark:text-amber-300!">
              Review follow-ups <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Business health for the period */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Open pipeline"
          icon={BadgeIndianRupee}
          value={formatINR(overview.pipelineValue)}
          note={plural(overview.openLeads, 'open lead')}
        />
        <StatTile
          label="Converted"
          icon={Target}
          value={String(overview.converted)}
          note={overview.wonValue ? `${formatINR(overview.wonValue)} booked` : 'Treatment booked'}
        />
        <StatTile
          label="Conversion rate"
          icon={Scale}
          value={overview.conversionRate === null ? '—' : `${overview.conversionRate}%`}
          note={`${overview.converted} of ${plural(overview.totalLeads, 'lead')}`}
        />
        <StatTile
          label="Lost"
          icon={XCircle}
          value={String(overview.lost)}
          note={overview.lost ? `${formatINR(overview.lostValue)} in treatment value` : 'None lost'}
        />
      </div>

      {/* Act now */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel
          title="Who to call today"
          icon={PhoneCall}
          action={
            <Button variant="link" onClick={() => onNavigateToPatients()} className="text-sm">
              All leads <ArrowRight className="w-4 h-4" />
            </Button>
          }
          flush
          className="xl:col-span-2"
        >
          {priority.length === 0 ? (
            <p className={`${muted} px-5 pb-5`}>No open leads to follow up. New enquiries will appear here.</p>
          ) : (
            <PriorityList leads={priority.slice(0, 6)} onOpenPatient={(id) => onNavigateToPatients(id)} />
          )}
        </Panel>

        <Panel
          title={dueNow.length > 0 ? 'Follow-ups due' : 'Upcoming follow-ups'}
          icon={CalendarCheck}
          subtitle={
            dueNow.length > 0
              ? `${dueNow.length} due today or overdue`
              : pendingTasks.length > 0
              ? 'Nothing due today'
              : undefined
          }
          action={
            pendingTasks.length > 0 && (
              <Button variant="link" onClick={onNavigateToFollowUps} className="text-sm">
                All <ArrowRight className="w-4 h-4" />
              </Button>
            )
          }
        >
          {shownTasks.length === 0 ? (
            <p className={muted}>Nothing pending.</p>
          ) : (
            <div className="-my-1 divide-y divide-gray-100 dark:divide-gray-700/60">
              {shownTasks.map((task) => (
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
        </Panel>
      </div>

      {/* Where conversion is won and lost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        <Panel title="Conversion funnel" icon={Filter}>
          {overview.totalLeads === 0 ? (
            <p className={muted}>No leads came in during this period.</p>
          ) : (
            <FunnelSteps steps={overview.funnel} />
          )}
        </Panel>

        <Panel title="Conversion by treatment" icon={Target}>
          {byTreatment.length === 0 ? (
            <p className={muted}>No leads came in during this period.</p>
          ) : (
            <MeterList
              rows={byTreatment.map((row) => ({
                label: row.label,
                percent: row.conversionRate,
                value: `${row.conversionRate}%`,
                detail: `${row.converted} of ${plural(row.leads, 'lead')}${row.lost ? ` · ${row.lost} lost` : ''}`,
                tone: 'good',
              }))}
            />
          )}
        </Panel>

        <LossReasonsCard
          overview={overview}
          className="lg:col-span-2 xl:col-span-1"
          action={
            <Button variant="link" onClick={onNavigateToInsights} className="text-sm">
              Insights <ArrowRight className="w-4 h-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
};
