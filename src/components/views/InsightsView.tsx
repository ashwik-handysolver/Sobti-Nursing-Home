import React, { useMemo } from 'react';
import { Megaphone, MessagesSquare, Route, Scale, Target, UserX } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import {
  buildConversionOverview,
  compareSources,
  compareTreatments,
  ComparisonRow,
  countConcerns,
  NO_SOURCE,
  treatmentOf,
} from '../../utils/conversion';
import { LossReasonsCard } from '../insights/LossReasonsCard';
import { Avatar, BarList, Card, EmptyState, formatRecordingDate, muted, PageHeader, SectionTitle } from '../ui';

interface InsightsViewProps {
  clients: ClientLead[];
  recordings: MeetingRecording[];
  onOpenPatient: (patientId: string) => void;
}

const th = 'py-2.5 px-4 font-medium whitespace-nowrap';
const td = 'py-3 px-4 whitespace-nowrap';
const tableHead = 'text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850';

// Leads, outcomes and conversion rate for each group (a treatment, a source, …)
const ComparisonTable: React.FC<{
  title: string;
  icon: React.ElementType;
  groupLabel: string;
  rows: ComparisonRow[];
  footnote?: string;
}> = ({ title, icon, groupLabel, rows, footnote }) => (
  <Card as="section" className="overflow-hidden">
    <div className="p-5 pb-4">
      <SectionTitle icon={icon}>{title}</SectionTitle>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={tableHead}>
            <th className={`${th} pl-5`}>{groupLabel}</th>
            <th className={`${th} text-right`}>Leads</th>
            <th className={`${th} text-right`}>Open</th>
            <th className={`${th} text-right`}>Converted</th>
            <th className={`${th} text-right`}>Lost</th>
            <th className={`${th} pr-5`}>Conversion rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className={`${td} pl-5 font-medium text-gray-900 dark:text-gray-100`}>{row.label}</td>
              <td className={`${td} text-right tabular-nums text-gray-900 dark:text-gray-100`}>{row.leads}</td>
              <td className={`${td} text-right tabular-nums text-gray-600 dark:text-gray-400`}>{row.open}</td>
              <td className={`${td} text-right tabular-nums text-gray-600 dark:text-gray-400`}>{row.converted}</td>
              <td className={`${td} text-right tabular-nums text-gray-600 dark:text-gray-400`}>{row.lost}</td>
              <td className={`${td} pr-5 w-1/3 min-w-40`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.conversionRate}%`, background: 'var(--viz-s2)' }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-gray-900 dark:text-gray-100">
                    {row.conversionRate}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {footnote && <p className={`${muted} px-5 py-3 border-t border-gray-100 dark:border-gray-700/60`}>{footnote}</p>}
  </Card>
);

export const InsightsView: React.FC<InsightsViewProps> = ({ clients, recordings, onOpenPatient }) => {
  const overview = useMemo(() => buildConversionOverview(clients), [clients]);
  const treatments = useMemo(() => compareTreatments(clients), [clients]);
  const sources = useMemo(() => compareSources(clients), [clients]);
  const concerns = useMemo(() => countConcerns(recordings), [recordings]);
  const lostLeads = useMemo(
    () =>
      clients
        .filter((c) => c.stage === 'Lost')
        .sort((a, b) => (b.lostDate || '').localeCompare(a.lostDate || '')),
    [clients]
  );

  if (clients.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Conversion Insights" />
        <EmptyState
          icon={Target}
          title="No leads yet"
          hint="Once patients are added and move through the lead stages, this page compares treatments and explains lost leads."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Conversion Insights" subtitle="Which treatments convert, and why leads are lost." />

      <ComparisonTable title="Treatment comparison" icon={Scale} groupLabel="Treatment" rows={treatments} />

      <ComparisonTable
        title="Lead sources"
        icon={Megaphone}
        groupLabel="Source"
        rows={sources}
        footnote={
          sources.every((row) => row.label === NO_SOURCE)
            ? 'No lead has a source yet. Set it on the patient form, or apply the suggestion when a recording mentions it.'
            : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <LossReasonsCard overview={overview} />
        <Card as="section" className="p-5">
          <SectionTitle icon={Route}>Where leads are lost</SectionTitle>
          {overview.lost === 0 ? (
            <p className={`${muted} mt-3`}>The stage each lead was lost at will show up here.</p>
          ) : (
            <BarList items={overview.dropOff} total={overview.lost} totalLabel="lost leads" color={() => '#f43f5e'} />
          )}
        </Card>
      </div>

      {lostLeads.length > 0 && (
        <Card as="section" className="overflow-hidden">
          <div className="p-5 pb-4">
            <SectionTitle icon={UserX}>Lost leads</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={tableHead}>
                  <th className={`${th} pl-5`}>Patient</th>
                  <th className={th}>Treatment</th>
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
        </Card>
      )}

      <Card as="section" className="p-5">
        <SectionTitle icon={MessagesSquare}>Concerns raised in conversations</SectionTitle>
        {concerns.length === 0 ? (
          <p className={`${muted} mt-3`}>No concerns have been picked up from recordings yet.</p>
        ) : (
          <>
            <BarList
              items={concerns}
              total={recordings.length}
              totalLabel="conversations"
              color={() => 'var(--viz-s1)'}
            />
            <p className={`${muted} mt-4`}>
              Share of {recordings.length} analyzed {recordings.length === 1 ? 'conversation' : 'conversations'} where
              each concern came up
            </p>
          </>
        )}
      </Card>
    </div>
  );
};
