import React, { useState, useMemo } from 'react';
import { AudioLines, Trash2, UserPlus } from 'lucide-react';
import { MeetingRecording } from '../../types/meeting';
import {
  Avatar,
  Button,
  Card,
  chanceTone,
  Chip,
  ConversionBadge,
  Dropdown,
  EmptyState,
  formatRecordingDate,
  IconButton,
  muted,
  PageHeader,
  SearchInput,
} from '../ui';

interface RecordingsListViewProps {
  recordings: MeetingRecording[];
  onSelectRecording: (id: string) => void;
  onDeleteRecording: (id: string) => void;
  onAddPatient: () => void;
}

type ConversionFilter = 'all' | 'high' | 'moderate' | 'low';

const CONVERSION_FILTERS: { id: ConversionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'low', label: 'Low' },
];

const NOT_LINKED = '__not_linked__';

export const RecordingsListView: React.FC<RecordingsListViewProps> = ({
  recordings,
  onSelectRecording,
  onDeleteRecording,
  onAddPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversionFilter, setConversionFilter] = useState<ConversionFilter>('all');
  const [patientFilter, setPatientFilter] = useState('all');

  const patientNames = useMemo(
    () => [...new Set(recordings.map((r) => r.clientName).filter(Boolean) as string[])].sort(),
    [recordings]
  );
  const hasUnlinked = recordings.some((r) => !r.clientName);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return recordings.filter((r) => {
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.filename.toLowerCase().includes(q) ||
        (r.clientName && r.clientName.toLowerCase().includes(q)) ||
        (r.salespersonName && r.salespersonName.toLowerCase().includes(q));

      const chance = r.estimatedConversionChance;
      const matchConversion =
        conversionFilter === 'all' || (typeof chance === 'number' && chanceTone(chance).key === conversionFilter);

      const matchPatient =
        patientFilter === 'all' || (patientFilter === NOT_LINKED ? !r.clientName : r.clientName === patientFilter);

      return matchSearch && matchConversion && matchPatient;
    });
  }, [recordings, searchQuery, conversionFilter, patientFilter]);


  if (recordings.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Recordings" />
        <EmptyState
          icon={AudioLines}
          title="No recordings yet"
          hint="Recordings are uploaded when you add a new patient."
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
    <div className="space-y-5">
      <PageHeader title="Recordings" />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recordings"
          aria-label="Search recordings"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5" role="group" aria-label="Filter by conversion">
            {CONVERSION_FILTERS.map((f) => (
              <Chip key={f.id} active={conversionFilter === f.id} onClick={() => setConversionFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>

          <Dropdown
            value={patientFilter}
            onChange={setPatientFilter}
            options={[
              { value: 'all', label: 'All patients' },
              ...patientNames,
              ...(hasUnlinked ? [{ value: NOT_LINKED, label: 'Not linked' }] : []),
            ]}
            aria-label="Filter by patient"
            className="w-auto"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className={muted}>No recordings match these filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setConversionFilter('all');
                setPatientFilter('all');
              }}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850">
                <th className="py-2.5 pl-5 pr-3 font-medium hidden sm:table-cell">Patient</th>
                <th className="py-2.5 px-3 pl-5 sm:pl-3 font-medium">Recording</th>
                <th className="py-2.5 px-3 font-medium hidden lg:table-cell">Date</th>
                <th className="py-2.5 px-3 font-medium hidden lg:table-cell">Length</th>
                <th className="py-2.5 px-3 font-medium">Conversion</th>
                <th className="py-2.5 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
              {filtered.map((rec) => {
                const when = formatRecordingDate(rec.uploadDate);
                return (
                  <tr
                    key={rec.id}
                    onClick={() => onSelectRecording(rec.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 pl-5 pr-3 hidden sm:table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={rec.clientName} />
                        <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {rec.clientName || <span className="text-gray-400">Not linked</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 pl-5 sm:pl-3 w-full max-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{rec.title}</div>
                      <div className={`${muted} mt-0.5 truncate lg:hidden`}>
                        <span className="sm:hidden">{rec.clientName ? `${rec.clientName} · ` : ''}</span>
                        {when.date}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-gray-900 dark:text-gray-100">{when.date}</div>
                      {when.time && <div className={muted}>{when.time}</div>}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-gray-600 dark:text-gray-400 tabular-nums hidden lg:table-cell">
                      {rec.durationFormatted}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <ConversionBadge value={rec.estimatedConversionChance} />
                    </td>
                    <td className="py-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        tone="danger"
                        onClick={() => onDeleteRecording(rec.id)}
                        title="Delete recording"
                        aria-label="Delete recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
