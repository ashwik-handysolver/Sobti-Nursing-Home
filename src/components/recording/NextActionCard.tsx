import React, { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, Sparkles } from 'lucide-react';
import { ClientLead, MeetingRecording, TranscriptSegment } from '../../types/meeting';
import { CLINIC_NAME, CLINIC_PHONE } from '../../data/clinic';
import { whatsappLink } from '../../utils/format';
import { Button, muted, Panel, TextArea } from '../ui';

interface NextActionCardProps {
  recording: MeetingRecording;
  client?: ClientLead;
  nextStep?: string;
  concern?: { text: string; segment: TranscriptSegment | null };
  onJump: (segment: TranscriptSegment) => void;
}

// Used when the analysis did not draft a message (recordings analyzed before it could)
function templateMessage(name: string | undefined, procedure: string | undefined) {
  const first = (name || '').replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').split(/\s+/)[0];
  return [
    `Namaste${first ? ` ${first}` : ''}, thank you for your consultation at ${CLINIC_NAME}.`,
    procedure
      ? `If you have any questions about ${procedure}, or would like to fix a date, just reply here.`
      : 'If you have any questions, or would like to fix a date, just reply here.',
    `You can also call us on ${CLINIC_PHONE}.`,
  ].join(' ');
}

// The top of an analyzed recording: what to do next, the concern to address, and a message ready to send
export const NextActionCard: React.FC<NextActionCardProps> = ({ recording, client, nextStep, concern, onJump }) => {
  const drafted = Boolean(recording.followUpMessage);
  const initial =
    recording.followUpMessage || templateMessage(client?.name || recording.clientName, client?.procedureName || recording.procedureDiscussed);
  const [message, setMessage] = useState(initial);
  const [copied, setCopied] = useState(false);

  // A re-analysis or a different recording brings a new draft
  useEffect(() => setMessage(initial), [initial]);

  const whatsapp = whatsappLink(client?.phone, message);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Panel
      title="Next best action"
      icon={Sparkles}
      className="border-blue-200! dark:border-blue-500/30! bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-500/5 dark:to-gray-800"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className={muted}>Do next</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100 leading-snug">
              {nextStep || 'Call the patient to answer any open questions and agree a date.'}
            </dd>
          </div>
          {concern && (
            <div>
              <dt className={muted}>Address this concern</dt>
              <dd className="mt-0.5 text-gray-800 dark:text-gray-200 leading-snug">
                {concern.text}{' '}
                {concern.segment && (
                  <button
                    onClick={() => onJump(concern.segment!)}
                    className="text-xs tabular-nums font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                    title="Jump to where this was said"
                  >
                    ▸ {concern.segment.timestamp}
                  </button>
                )}
              </dd>
            </div>
          )}
        </dl>

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className={muted}>Message to the patient</span>
            <span className={`${muted} italic`}>{drafted ? 'Drafted from the conversation' : 'Template, edit before sending'}</span>
          </div>
          <TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            aria-label="Message to the patient"
            className="leading-relaxed resize-y bg-white! dark:bg-gray-900!"
          />
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Open in WhatsApp
              </a>
            ) : (
              <span className={muted}>Add the patient's mobile number to send it on WhatsApp.</span>
            )}
            <Button variant="outline" size="sm" type="button" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
