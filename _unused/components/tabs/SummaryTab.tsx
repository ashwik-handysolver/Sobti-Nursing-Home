import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Copy,
  Check,
} from 'lucide-react';
import { MeetingSummary } from '../../types/meeting';

interface SummaryTabProps {
  summary: MeetingSummary;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  const [copied, setCopied] = useState(false);

  const copySummaryText = () => {
    const text = `EXECUTIVE SUMMARY:
${summary.executiveSummary}

QUICK BULLET OVERVIEW:
${summary.quickBulletOverview.map((b) => `• ${b}`).join('\n')}

TOPICS:
${summary.keyTopics
  .map(
    (t) =>
      `${t.title}\n${t.summary}\n${t.bullets.map((b) => ` - ${b}`).join('\n')}`
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Hero Card */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-6 sm:p-7 border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Executive Summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI synthesis grounded strictly in spoken audio discussion
              </p>
            </div>
          </div>

          <button
            onClick={copySummaryText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
          {summary.executiveSummary}
        </p>

        {/* Quick bullet overview for fast skimming */}
        {summary.quickBulletOverview?.length > 0 && (
          <div className="mt-5 pt-5 border-t border-indigo-100/80 dark:border-indigo-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">
              Quick Skim Takeaways
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.quickBulletOverview.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlights, Challenges & Outcomes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Highlights */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Key Highlights
            </h4>
          </div>
          <ul className="space-y-2">
            {(summary.highlights || []).map((h, i) => (
              <li
                key={i}
                className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="text-emerald-500 font-bold">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Challenges */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Bottlenecks & Challenges
            </h4>
          </div>
          <ul className="space-y-2">
            {(summary.challenges || []).map((c, i) => (
              <li
                key={i}
                className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="text-amber-500 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Outcomes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Outcomes & Direction
            </h4>
          </div>
          <ul className="space-y-2">
            {(summary.outcomes || []).map((o, i) => (
              <li
                key={i}
                className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="text-indigo-500 font-bold">•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
