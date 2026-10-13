import React, { useState } from 'react';
import { Check, CheckCircle2, Route, XCircle } from 'lucide-react';
import { ClientLead, LeadStage } from '../../types/meeting';
import { LEAD_FLAGS, PIPELINE_STAGES, STAGE_HINTS, furthestStageIndex, isOpenLead, withStage } from '../../utils/leads';
import { LostReasonSuggestion } from '../../utils/lostReasons';
import { Card, Chip, muted, SectionTitle } from '../ui';
import { LostReasonDialog } from './LostReasonDialog';

interface LeadLifecycleProps {
  client: ClientLead;
  lostReasonSuggestion: LostReasonSuggestion | null; // from this patient's recordings
  onChange: (client: ClientLead) => void;
}

const stepBase = 'p-3 rounded-lg border text-left transition-colors cursor-pointer';
const stepIdle =
  'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400';

// Where the lead is on its way from enquiry to booked treatment, with one-click moves between stages
export const LeadLifecycle: React.FC<LeadLifecycleProps> = ({ client, lostReasonSuggestion, onChange }) => {
  const [isAskingReason, setIsAskingReason] = useState(false);
  const reached = furthestStageIndex(client);
  const isLost = client.stage === 'Lost';
  const isConverted = client.stage === 'Converted';
  const moveTo = (stage: LeadStage) => {
    if (stage !== client.stage) onChange(withStage(client, stage));
  };

  return (
    <Card as="section" className="p-5">
      <SectionTitle icon={Route}>Lead lifecycle</SectionTitle>

      <ol className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {PIPELINE_STAGES.map((stage, index) => {
          const isCurrent = client.stage === stage;
          const isPassed = !isCurrent && index <= reached;
          return (
            <li key={stage} className="flex">
              <button
                onClick={() => moveTo(stage)}
                aria-current={isCurrent ? 'step' : undefined}
                title={isCurrent ? 'Current stage' : `Move to ${stage}`}
                className={`${stepBase} flex-1 ${
                  isCurrent
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : isPassed
                    ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-gray-100'
                    : stepIdle
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {isPassed && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  <span>{stage}</span>
                </span>
                <span className={`${muted} block mt-0.5`}>{STAGE_HINTS[stage]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={() => moveTo('Converted')}
          aria-pressed={isConverted}
          className={`${stepBase} ${
            isConverted
              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : stepIdle
          }`}
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Converted</span>
          </span>
          <span className={`${muted} block mt-0.5`}>{STAGE_HINTS.Converted}</span>
        </button>
        <button
          onClick={() => setIsAskingReason(true)}
          aria-pressed={isLost}
          title={isLost ? 'Change the reason' : 'Mark as lost'}
          className={`${stepBase} ${
            isLost
              ? 'border-rose-600 dark:border-rose-500 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
              : stepIdle
          }`}
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Lost</span>
          </span>
          <span className={`${muted} block mt-0.5`}>
            {isLost
              ? `At ${client.lostAtStage || 'New Lead'} · ${client.lostReason || 'Unknown'}`
              : STAGE_HINTS.Lost}
          </span>
        </button>
      </div>

      {isOpenLead(client) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className={muted}>Mark as</span>
          {LEAD_FLAGS.map((flag) => (
            <Chip
              key={flag}
              active={client.flag === flag}
              onClick={() => onChange({ ...client, flag: client.flag === flag ? undefined : flag })}
              className="text-xs! py-1!"
            >
              {flag}
            </Chip>
          ))}
        </div>
      )}

      {isAskingReason && (
        <LostReasonDialog
          client={client}
          suggestion={lostReasonSuggestion}
          onClose={() => setIsAskingReason(false)}
          onConfirm={(reason) => {
            onChange(withStage(client, 'Lost', { reason }));
            setIsAskingReason(false);
          }}
        />
      )}
    </Card>
  );
};
