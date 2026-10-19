import React, { useMemo } from 'react';
import { Megaphone, Route, Target, UserX } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import {
  buildConversionOverview,
  compareSources,
  compareTreatments,
  ComparisonRow,
  concernsAmongLost,
  leadsInPeriod,
  NO_SOURCE,
  PERIOD_OPTIONS,
  PeriodId,
  treatmentOf,
} from '../../utils/conversion';
import { formatINR } from '../../utils/format';
import { usePeriod } from '../../utils/usePeriod';
import { LossReasonsCard } from '../insights/LossReasonsCard';
import {
  Avatar,
  EmptyState,
  formatRecordingDate,
  FunnelSteps,
  MeterList,
  PageHeader,
  Panel,
  SegmentedControl,
} from '../ui';

interface InsightsViewProps {
  clients: ClientLead[];
  recordings: MeetingRecording[];
  onOpenPatient: (patientId: string) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Conversion rate per group, with the counts behind it underneath
const conversionRows = (rows: ComparisonRow[]) =>
  rows.map((row) => ({
    label: row.label,
    percent: row.conversionRate,
    value: `${row.conversionRate}%`,
    detail: `${row.converted} of ${plural(row.leads, 'lead')} converted${row.lost ? ` · ${row.lost} lost` : ''}${
      row.open ? ` · ${row.open} open` : ''
    }`,
    tone: 'good' as const,
  }));

const th = 'py-2.5 px-4 font-medium whitespace-nowrap';
const td = 'py-3 px-4 whitespace-nowrap';

export const InsightsView: React.FC<InsightsViewProps> = ({ clients, recordings, onOpenPatient }) => {
  const [period, setPeriod] = usePeriod();
  const leads = useMemo(() => leadsInPeriod(clients, period), [clients, period]);
  const overview = useMemo(() => buildConversionOverview(leads), [leads]);
  const treatments = useMemo(() => compareTreatments(leads), [leads]);
  const sources = useMemo(() => compareSources(leads), [leads]);
  const lostConcerns = useMemo(() => concernsAmongLost(leads, recordings), [leads, recordings]);
  const lostLeads = useMemo(
    () => leads.filter((c) => c.stage === 'Lost').sort((a, b) => (b.lostDate || '').localeCompare(a.lostDate || '')),
    [leads]
  );

  if (clients.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Conversion Insights" />
        <EmptyState
          icon={Target}
          title="No leads yet"
          hint="Once patients are added and move through the lead stages, this page shows which treatments convert and why leads are lost."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Conversion Insights"
        subtitle={`${plural(leads.length, 'lead')} in this period · ${formatINR(overview.wonValue)} booked · ${formatINR(
          overview.lostValue
        )} lost`}
        className="flex flex-col md:flex-row md:items-end justify-between gap-3"
      >
        <SegmentedControl<PeriodId> value={period} onChange={setPeriod} options={PERIOD_OPTIONS} aria-label="Period" />
      </PageHeader>

      {leads.length === 0 ? (
        <EmptyState icon={Target} title="No leads in this period" hint="Pick a longer period to see more." />
      ) : (
        <>
          {/* What converts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Conversion by treatment" icon={Target}>
              <MeterList rows={conversionRows(treatments)} />
            </Panel>
            <Panel
              title="Conversion by lead source"
              icon={Megaphone}
              subtitle={
                sources.every((row) => row.label === NO_SOURCE)
                  ? 'No lead has a source yet: set it on the patient form, or apply the suggestion from a recording'
                  : undefined
              }
            >
              <MeterList rows={conversionRows(sources)} />
            </Panel>
          </div>

          {/* Why and where leads are lost */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LossReasonsCard overview={overview} concerns={lostConcerns} />
            <Panel title="Where leads drop off" icon={Route}>
              <FunnelSteps steps={overview.funnel} />
            </Panel>
          </div>

          {lostLeads.length > 0 && (
            <Panel title="Lost leads" icon={UserX} flush>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850 border-y border-gray-100 dark:border-gray-700/60">
                      <th className={`${th} pl-5`}>Patient</th>
                      <th className={th}>Treatment</th>
                      <th className={th}>Value</th>
                      <th className={th}>Lost at</th>
                      <th className={th}>Reason</th>
                      <th className={`${th} pr-5`}>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {lostLeads.map((client) => (
                      <tr
                        key={client.id}
                        onClick={() => onOpenPatient(client.id)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors cursor-pointer"
                      >
                        <td className={`${td} pl-5`}>
                          <div className="flex items-center gap-3">
                            <Avatar name={client.name} />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{client.name}</span>
                          </div>
                        </td>
                        <td className={`${td} text-gray-600 dark:text-gray-400`}>{treatmentOf(client)}</td>
                        <td className={`${td} tabular-nums text-gray-600 dark:text-gray-400`}>
                          {client.numericValue ? formatINR(client.numericValue) : '—'}
                        </td>
                        <td className={`${td} text-gray-600 dark:text-gray-400`}>{client.lostAtStage || 'New Lead'}</td>
                        <td className={`${td} text-gray-900 dark:text-gray-100`}>{client.lostReason || 'Unknown'}</td>
                        <td className={`${td} pr-5 text-gray-600 dark:text-gray-400`}>
                          {client.lostDate ? formatRecordingDate(client.lostDate).date : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
};
