import React from 'react';
import { MessageSquareQuote, Presentation } from 'lucide-react';
import { PitchAnalysis } from '../../types/meeting';
import { muted, Panel } from '../ui';

const RATING_LABELS: { key: keyof PitchAnalysis['ratings']; label: string }[] = [
  { key: 'rapport', label: 'Building rapport' },
  { key: 'needsDiscovery', label: 'Understanding needs' },
  { key: 'objectionHandling', label: 'Handling concerns' },
  { key: 'clarity', label: 'Explaining clearly' },
  { key: 'closing', label: 'Agreeing a next step' },
];

const verdict = (score: number) =>
  score >= 80 ? 'Strong' : score >= 65 ? 'Solid' : score >= 50 ? 'Mixed' : 'Needs work';

const UNAVAILABLE =
  'Not available for this recording. It was analyzed before consultation reviews existed; use Re-analyze to get one.';

// The skill rated highest and the one rated lowest; nothing when they are level
function strongestAndWeakest(pitch: PitchAnalysis) {
  const rated = RATING_LABELS.map(({ key, label }) => ({ label, value: pitch.ratings[key] || 0 })).filter((r) => r.value > 0);
  if (rated.length < 2) return null;
  const sorted = [...rated].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  return strongest.value === weakest.value ? null : { strongest: strongest.label, weakest: weakest.label };
}

// Pitch tab: how the consultation was handled, in a few lines a doctor or counsellor can act on.
// Read-only: it is the analysis's assessment and is not edited by hand.
export const PitchReviewCard: React.FC<{
  pitch?: PitchAnalysis;
  onJump: (seconds: number) => void;
}> = ({ pitch, onJump }) => {
  if (!pitch) {
    return (
      <Panel title="Consultation review" icon={Presentation}>
        <p className={muted}>{UNAVAILABLE}</p>
      </Panel>
    );
  }

  const skills = strongestAndWeakest(pitch);
  const moments = pitch.missedOpportunities.slice(0, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Panel title="Consultation review" icon={Presentation}>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{pitch.overallScore}</span>
          <span className="text-lg text-gray-400">/100</span>
          <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-300">{verdict(pitch.overallScore)}</span>
        </div>
        {pitch.summary && <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{pitch.summary}</p>}
        {(skills || pitch.strengths[0]) && (
          <dl className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-3 text-sm">
            {skills && (
              <>
                <div>
                  <dt className={muted}>Strongest</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{skills.strongest}</dd>
                </div>
                <div>
                  <dt className={muted}>Work on</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{skills.weakest}</dd>
                </div>
              </>
            )}
            {pitch.strengths[0] && (
              <div>
                <dt className={muted}>What worked</dt>
                <dd className="text-gray-900 dark:text-gray-100 leading-snug">{pitch.strengths[0]}</dd>
              </div>
            )}
          </dl>
        )}
      </Panel>

      <Panel
        title="Say this next time"
        icon={MessageSquareQuote}
        className="lg:col-span-2"
      >
        {moments.length === 0 ? (
          <p className={muted}>No moments stood out. The consultation covered what the patient needed.</p>
        ) : (
          <ul className="space-y-3">
            {moments.map((m, i) => (
              <li key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-700/60">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  {m.timestamp && (
                    <button
                      onClick={() => onJump(m.seconds)}
                      className="mr-2 text-xs tabular-nums font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      title="Play from this moment"
                    >
                      ▸ {m.timestamp}
                    </button>
                  )}
                  {m.whatHappened}
                </p>
                <p className="mt-2 pl-3 border-l-2 border-blue-500 text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                  “{m.suggestion}”
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};
