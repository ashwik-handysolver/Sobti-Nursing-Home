import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { PriorityLead } from '../../utils/priority';
import { treatmentOf } from '../../utils/conversion';
import { formatINR, telLink, whatsappLink } from '../../utils/format';
import { Avatar, ConversionBadge, muted, StageBadge } from '../ui';

interface PriorityListProps {
  leads: PriorityLead[];
  onOpenPatient: (patientId: string) => void;
}

const actionLink =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400 dark:hover:border-blue-500/50 transition-colors';

// "Who to call today": open leads in the order they are worth calling, each with the reason it is
// on the list, what is holding the patient back, and one-tap call and WhatsApp
export const PriorityList: React.FC<PriorityListProps> = ({ leads, onOpenPatient }) => (
  <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
    {leads.map(({ client, concern, nextStep, reasons }) => {
      const tel = telLink(client.phone);
      const whatsapp = whatsappLink(client.phone);
      return (
        <li key={client.id} className="flex items-start gap-3 px-5 py-3.5">
          <Avatar name={client.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onOpenPatient(client.id)}
                className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                {client.name}
              </button>
              <StageBadge stage={client.stage} />
            </div>
            <p className={`${muted} mt-0.5`}>
              {[treatmentOf(client), client.numericValue ? formatINR(client.numericValue) : null, ...reasons.slice(1)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {(concern || nextStep) && (
              <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
                {concern && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Concern:</span> {concern}
                  </>
                )}
                {concern && nextStep && <span className="text-gray-300 dark:text-gray-600"> · </span>}
                {nextStep && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Next:</span> {nextStep}
                  </>
                )}
              </p>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <ConversionBadge value={client.conversionChance} />
            {tel && (
              <a href={tel} className={actionLink} title={`Call ${client.name}`} aria-label={`Call ${client.name}`}>
                <Phone className="w-4 h-4" />
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className={actionLink}
                title={`WhatsApp ${client.name}`}
                aria-label={`WhatsApp ${client.name}`}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </li>
      );
    })}
  </ul>
);
