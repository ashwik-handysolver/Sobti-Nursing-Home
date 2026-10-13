import React from 'react';
import { Lightbulb, TrendingDown } from 'lucide-react';
import { ConversionOverview } from '../../utils/conversion';
import { BarList, Card, muted, SectionTitle } from '../ui';

// "Why are we losing leads?": lost leads by confirmed reason, with a one-line takeaway
export const LossReasonsCard: React.FC<{ overview: ConversionOverview; action?: React.ReactNode }> = ({
  overview,
  action,
}) => (
  <Card as="section" className="p-5">
    <div className="flex items-center justify-between gap-3">
      <SectionTitle icon={TrendingDown}>Why are we losing leads?</SectionTitle>
      {action}
    </div>
    {overview.lost === 0 ? (
      <p className={`${muted} mt-3`}>
        No leads have been marked as lost yet. When one is, its reason will show up here.
      </p>
    ) : (
      <>
        <BarList
          items={overview.lossReasons}
          total={overview.lost}
          totalLabel="lost leads"
          color={() => 'var(--viz-s1)'}
        />
        <p className={`${muted} mt-4`}>
          Reasons recorded for {overview.lost} lost {overview.lost === 1 ? 'lead' : 'leads'}
        </p>
        {overview.lossInsight && (
          <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-850">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{overview.lossInsight}</p>
          </div>
        )}
      </>
    )}
  </Card>
);
