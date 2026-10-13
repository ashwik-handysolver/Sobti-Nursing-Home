import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, AudioLines, CalendarCheck, Edit2, Trash2, UploadCloud } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import { describeDue } from '../../utils/tasks';
import {
  Avatar,
  Button,
  Card,
  ConversionBadge,
  formatRecordingDate,
  IconButton,
  muted,
  SectionTitle,
  StageBadge,
  TaskRow,
} from '../ui';

interface PatientProfileProps {
  client: ClientLead;
  recordings: MeetingRecording[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectRecording: (recordingId: string) => void;
  onUploadRecording: () => void;
  onToggleTaskStatus?: (taskId: string) => void;
}

const Detail: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className = 'text-sm text-gray-900 dark:text-gray-100 mt-0.5',
  children,
}) => (
  <div className="min-w-0">
    <dt className={muted}>{label}</dt>
    <dd className={className}>{children}</dd>
  </div>
);

export const PatientProfile: React.FC<PatientProfileProps> = ({
  client,
  recordings,
  onBack,
  onEdit,
  onDelete,
  onSelectRecording,
  onUploadRecording,
  onToggleTaskStatus,
}) => {
  const clientRecordings = useMemo(
    () => recordings.filter((r) => r.clientId === client.id || client.recordingIds.includes(r.id)),
    [client, recordings]
  );

  // All extracted tasks belonging to this patient's consultations
  const clientTasks = useMemo(
    () =>
      clientRecordings.flatMap((r) =>
        r.tasks.map((t) => ({ ...t, recordingId: r.id, recordingTitle: r.title, due: describeDue(t, r.uploadDate) }))
      ),
    [clientRecordings]
  );

  // Conversion estimates across this patient's recordings, oldest first
  const conversionTrend = useMemo(
    () =>
      clientRecordings
        .filter((r) => typeof r.estimatedConversionChance === 'number')
        .sort((a, b) => a.uploadDate.localeCompare(b.uploadDate))
        .map((r) => r.estimatedConversionChance!),
    [clientRecordings]
  );
  const firstChance = conversionTrend[0];
  const latestChance = conversionTrend[conversionTrend.length - 1];

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Patients</span>
      </button>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <Avatar name={client.name} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{client.name}</h1>
                <StageBadge stage={client.stage} shape="tag" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{client.condition}</p>
              <p className={`${muted} mt-1`}>
                {[client.age ? `${client.age} yrs` : null, client.gender, client.phone, client.email]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconButton onClick={onEdit} title="Edit patient" aria-label="Edit patient">
              <Edit2 className="w-4 h-4" />
            </IconButton>
            <IconButton tone="danger" onClick={onDelete} title="Delete patient" aria-label="Delete patient">
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <Detail label="Procedure">{client.procedureName}</Detail>
          <Detail label="Value" className="text-sm text-gray-900 dark:text-gray-100 mt-0.5 tabular-nums">
            {client.procedureValue}
          </Detail>
          <Detail label="Doctor">{client.assignedDoctor.split('(')[0].trim()}</Detail>
          <Detail label="Conversion" className="mt-0.5 flex items-center gap-1.5">
            {conversionTrend.length >= 2 ? (
              <>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{firstChance}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                <ConversionBadge value={latestChance} />
                {latestChance !== firstChance && (
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      latestChance > firstChance
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                    title={`Across ${conversionTrend.length} recordings`}
                  >
                    {latestChance > firstChance ? '+' : ''}
                    {latestChance - firstChance}
                  </span>
                )}
              </>
            ) : (
              <ConversionBadge value={client.conversionChance} />
            )}
          </Detail>
        </dl>

        {(client.conversionIssues?.length > 0 || client.conversionNextStep || client.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60">
            {client.conversionIssues?.length > 0 && (
              <div>
                <h3 className={`${muted} font-medium mb-1.5`}>Concerns</h3>
                <ul className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
                  {client.conversionIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {client.conversionNextStep && (
              <div>
                <h3 className={`${muted} font-medium mb-1.5`}>Next step</h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{client.conversionNextStep}</p>
              </div>
            )}
            {client.notes && (
              <div className="md:col-span-2">
                <h3 className={`${muted} font-medium mb-1.5`}>Notes</h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card as="section" className="p-5">
          <SectionTitle icon={AudioLines}>Recordings</SectionTitle>
          {clientRecordings.length === 0 ? (
            <div className="py-4">
              <p className={muted}>No recording was uploaded when this patient was added.</p>
              <Button onClick={onUploadRecording} className="mt-3">
                <UploadCloud className="w-4 h-4" />
                <span>Upload recording</span>
              </Button>
            </div>
          ) : (
            <div className="mt-1 divide-y divide-gray-100 dark:divide-gray-700/60">
              {clientRecordings.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => onSelectRecording(rec.id)}
                  className="w-full flex items-center justify-between gap-3 py-2.5 text-left cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {rec.title}
                    </div>
                    <div className={`${muted} mt-0.5`}>{formatRecordingDate(rec.uploadDate).date}</div>
                  </div>
                  <ConversionBadge value={rec.estimatedConversionChance} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card as="section" className="p-5">
          <SectionTitle icon={CalendarCheck}>Follow-ups</SectionTitle>
          {clientTasks.length === 0 ? (
            <p className={`${muted} py-4`}>No follow-ups.</p>
          ) : (
            <div className="mt-1 divide-y divide-gray-100 dark:divide-gray-700/60">
              {clientTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  due={task.due}
                  onToggle={() => onToggleTaskStatus && onToggleTaskStatus(task.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
