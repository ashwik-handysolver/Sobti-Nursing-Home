import React from 'react';
import { Sparkles } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import { categorizeTreatment, treatmentOf } from '../../utils/conversion';
import { PIPELINE_STAGES, furthestStageIndex, isOpenLead, isPipelineStage, withStage } from '../../utils/leads';
import { Button, Card, SectionTitle } from '../ui';

interface LeadSuggestionsProps {
  client: ClientLead;
  recordings: MeetingRecording[]; // this patient's recordings
  onUpdate: (client: ClientLead) => void;
}

interface Suggestion {
  key: string;
  text: React.ReactNode;
  apply: () => ClientLead;
}

const strong = 'font-semibold text-gray-900 dark:text-gray-100';

// Changes to the patient record that the latest analyzed conversation points to.
// Nothing is applied until someone presses Apply; Dismiss hides a suggestion for good.
export const LeadSuggestions: React.FC<LeadSuggestionsProps> = ({ client, recordings, onUpdate }) => {
  const latest = [...recordings]
    .filter((r) => r.leadSignals)
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))[0];
  if (!latest?.leadSignals) return null;

  const { treatment, suggestedStage, leadSource } = latest.leadSignals;
  const ignored = client.ignoredSuggestions || [];
  const suggestions: Suggestion[] = [];

  if (treatment && categorizeTreatment(treatment) !== treatmentOf(client)) {
    suggestions.push({
      key: `${latest.id}:treatment`,
      text: (
        <>
          The conversation was about <span className={strong}>{treatment}</span>, but the record says{' '}
          {client.procedureName || 'no procedure'}.
        </>
      ),
      apply: () => ({ ...client, procedureName: treatment }),
    });
  }

  if (suggestedStage && isOpenLead(client)) {
    const rank = isPipelineStage(suggestedStage) ? PIPELINE_STAGES.indexOf(suggestedStage) : PIPELINE_STAGES.length;
    // Only ever suggest moving a lead forward
    if (suggestedStage !== 'Lost' && rank > furthestStageIndex(client)) {
      suggestions.push({
        key: `${latest.id}:stage`,
        text: (
          <>
            This lead looks ready to move from {client.stage} to <span className={strong}>{suggestedStage}</span>.
          </>
        ),
        apply: () => withStage(client, suggestedStage),
      });
    }
  }

  if (leadSource && !client.leadSource) {
    suggestions.push({
      key: `${latest.id}:source`,
      text: (
        <>
          The patient said how they found the clinic: <span className={strong}>{leadSource}</span>.
        </>
      ),
      apply: () => ({ ...client, leadSource }),
    });
  }

  const open = suggestions.filter((s) => !ignored.includes(s.key));
  if (open.length === 0) return null;

  return (
    <Card as="section" className="p-5">
      <SectionTitle icon={Sparkles}>Suggested from the latest conversation</SectionTitle>
      <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700/60">
        {open.map((suggestion) => (
          <li key={suggestion.key} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{suggestion.text}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" onClick={() => onUpdate(suggestion.apply())}>
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUpdate({ ...client, ignoredSuggestions: [...ignored, suggestion.key] })}
              >
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
