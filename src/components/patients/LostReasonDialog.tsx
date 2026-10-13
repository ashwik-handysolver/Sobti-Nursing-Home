import React, { useState } from 'react';
import { Lightbulb, XCircle } from 'lucide-react';
import { ClientLead, LostReason } from '../../types/meeting';
import { LOST_REASONS, LOST_REASON_HINTS, LostReasonSuggestion } from '../../utils/lostReasons';
import { Button, Modal, muted } from '../ui';

interface LostReasonDialogProps {
  client: ClientLead;
  suggestion: LostReasonSuggestion | null;
  onConfirm: (reason: LostReason) => void;
  onClose: () => void;
}

// Asks why a lead did not proceed. A reason suggested from the conversation is pre-selected,
// but nothing is saved until the counsellor confirms it.
export const LostReasonDialog: React.FC<LostReasonDialogProps> = ({ client, suggestion, onConfirm, onClose }) => {
  const alreadyLost = client.stage === 'Lost';
  const [reason, setReason] = useState<LostReason | null>(
    (alreadyLost && client.lostReason) || suggestion?.reason || null
  );

  return (
    <Modal title={`Why did ${client.name} not proceed?`} icon={XCircle} onClose={onClose} className="max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reason) onConfirm(reason);
        }}
        className="space-y-4"
      >
        {suggestion && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="min-w-0 text-sm">
              <p className="text-gray-900 dark:text-gray-100">
                Suggested from the conversation: <span className="font-semibold">{suggestion.reason}</span>
              </p>
              <p className={`${muted} mt-0.5 line-clamp-2`}>“{suggestion.evidence}”</p>
            </div>
          </div>
        )}

        <div role="radiogroup" aria-label="Reason lost" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LOST_REASONS.map((option) => {
            const selected = reason === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setReason(option)}
                className={`px-3 py-2 rounded-lg border text-left text-sm transition-colors cursor-pointer ${
                  selected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="block">{option}</span>
                {LOST_REASON_HINTS[option] && (
                  <span className={`${muted} block font-normal`}>{LOST_REASON_HINTS[option]}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!reason}>
            {alreadyLost ? 'Save reason' : 'Mark as lost'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
