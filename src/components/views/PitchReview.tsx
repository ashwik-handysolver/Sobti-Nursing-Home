import React from 'react';
import { Presentation } from 'lucide-react';
import { PitchAnalysis } from '../../types/meeting';
import { Card, muted, SectionTitle } from '../ui';

const RATING_LABELS: { key: keyof PitchAnalysis['ratings']; label: string }[] = [
  { key: 'rapport', label: 'Rapport' },
  { key: 'needsDiscovery', label: 'Understanding needs' },
  { key: 'objectionHandling', label: 'Handling concerns' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'closing', label: 'Closing' },
];

const verdict = (score: number) =>
  score >= 80 ? 'Strong' : score >= 65 ? 'Solid' : score >= 50 ? 'Mixed' : 'Needs work';

const UNAVAILABLE =
  'Not available for this recording. It was analyzed before pitch reviews existed; use Re-analyze to get one.';

const ScoreHeader: React.FC<{ pitch: PitchAnalysis }> = ({ pitch }) => (
  <div className="flex items-baseline gap-2.5">
    <span className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
      {pitch.overallScore}
      <span className="text-xl text-gray-400">/100</span>
    </span>
    <span className="text-sm text-gray-600 dark:text-gray-300">{verdict(pitch.overallScore)}</span>
  </div>
);

const RatingBars: React.FC<{ pitch: PitchAnalysis }> = ({ pitch }) => (
  <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5">
    {RATING_LABELS.map(({ key, label }) => {
      const value = Math.max(0, Math.min(5, pitch.ratings[key] || 0));
      return (
        <React.Fragment key={key}>
          <dt className="text-sm text-gray-600 dark:text-gray-300">{label}</dt>
          <dd className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: 'var(--viz-s1)' }} />
          </dd>
          <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{value}/5</dd>
        </React.Fragment>
      );
    })}
  </dl>
);

// Text view: the full review, with what could have been said at each moment.
// Read-only: it is the analysis's assessment and is not edited by hand.
export const PitchReviewCard: React.FC<{
  pitch?: PitchAnalysis;
  onJump: (seconds: number) => void;
}> = ({ pitch, onJump }) => (
  <Card as="section" className="p-5 space-y-4">
    <SectionTitle icon={Presentation}>Pitch review</SectionTitle>

    {!pitch ? (
      <p className={muted}>{UNAVAILABLE}</p>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <div>
            <ScoreHeader pitch={pitch} />
            {pitch.summary && (
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mt-2">{pitch.summary}</p>
            )}
          </div>
          <RatingBars pitch={pitch} />
        </div>

        {pitch.strengths.length > 0 && (
          <div>
            <h3 className={`${muted} font-medium mb-1.5`}>What worked</h3>
            <ul className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
              {pitch.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pitch.missedOpportunities.length > 0 && (
          <div>
            <h3 className={`${muted} font-medium mb-2`}>What could have raised the conversion chance</h3>
            <ul className="space-y-2.5">
              {pitch.missedOpportunities.map((m, i) => (
                <li key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                    {m.timestamp && (
                      <button
                        onClick={() => onJump(m.seconds)}
                        className="mr-2 text-xs tabular-nums font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        title="Jump to this moment"
                      >
                        ▸ {m.timestamp}
                      </button>
                    )}
                    {m.whatHappened}
                  </p>
                  <div className="mt-2 pl-3 border-l-2 border-blue-500">
                    <span className={`${muted} block`}>Could have said</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">“{m.suggestion}”</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    )}
  </Card>
);

// Graph view: score, ratings as bars, and the moments to revisit
export const PitchScorecard: React.FC<{ pitch?: PitchAnalysis; onSeek: (seconds: number) => void }> = ({
  pitch,
  onSeek,
}) => (
  <Card as="section" className="p-5">
    <SectionTitle icon={Presentation}>Pitch scorecard</SectionTitle>

    {!pitch ? (
      <p className={`${muted} mt-2`}>{UNAVAILABLE}</p>
    ) : (
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2">
          <ScoreHeader pitch={pitch} />
          <div className="mt-4">
            <RatingBars pitch={pitch} />
          </div>
        </div>

        {pitch.missedOpportunities.length > 0 && (
          <div className="lg:col-span-3">
            <h3 className={`${muted} font-medium mb-2`}>Moments where a different reply could have helped</h3>
            <ul className="space-y-2">
              {pitch.missedOpportunities.map((m, i) => (
                <li key={i}>
                  <button
                    onClick={() => onSeek(m.seconds)}
                    title="Play from this moment"
                    className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-left hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <span className="shrink-0 text-xs tabular-nums font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                      {m.timestamp}
                    </span>
                    <span className="min-w-0">
                      <span className={`${muted} block`}>{m.whatHappened}</span>
                      <span className="block text-sm text-gray-900 dark:text-gray-100 mt-1 line-clamp-2">
                        “{m.suggestion}”
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </Card>
);
