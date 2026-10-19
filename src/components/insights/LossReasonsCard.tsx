import React from 'react';
import { Lightbulb, TrendingDown } from 'lucide-react';
import { ConcernTopicCount, ConversionOverview } from '../../utils/conversion';
import { formatINR } from '../../utils/format';
import { MeterList, muted, Panel } from '../ui';

// "Why are we losing leads?": lost leads by confirmed reason and the money each reason cost,
// with a one-line takeaway and (when given) what lost patients worried about in their consultations
export const LossReasonsCard: React.FC<{
  overview: ConversionOverview;
  concerns?: ConcernTopicCount[];
  action?: React.ReactNode;
  className?: string;
}> = ({ overview, concerns, action, className }) => (
  <Panel
    title="Why leads are lost"
    icon={TrendingDown}
    subtitle={overview.lost > 0 ? `${overview.lost} lost · ${formatINR(overview.lostValue)} in treatment value` : undefined}
    action={action}
    className={className}
  >
    {overview.lost === 0 ? (
      <p className={muted}>No leads have been marked as lost in this period.</p>
    ) : (
      <div className="space-y-4">
        <MeterList
          rows={overview.lossReasons.slice(0, 5).map((item) => ({
            label: item.label,
            percent: (item.value / overview.lost) * 100,
            value: item.value,
            detail: overview.lostValueByReason[item.label]
              ? `${formatINR(overview.lostValueByReason[item.label])} lost`
              : undefined,
            tone: item.label === 'Unknown' ? 'muted' : 'bad',
          }))}
        />
        {overview.lossInsight && (
          <p className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-500/10 text-sm text-gray-800 dark:text-gray-200 leading-snug">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            {overview.lossInsight}
          </p>
        )}
        {concerns && concerns.length > 0 && (
          <div>
            <h3 className={`${muted} font-medium mb-1.5`}>What lost patients worried about</h3>
            <ul className="flex flex-wrap gap-1.5">
              {concerns.slice(0, 4).map((topic) => (
                <li
                  key={topic.label}
                  className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700/60 text-xs text-gray-700 dark:text-gray-200"
                >
                  {topic.label} <span className="tabular-nums text-gray-500 dark:text-gray-400">· {topic.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </Panel>
);
