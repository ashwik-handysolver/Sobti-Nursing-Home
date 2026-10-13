import React from 'react';
import {
  CheckCircle,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { KeyDecision } from '../../types/meeting';

interface DecisionsTabProps {
  decisions: KeyDecision[];
}

export const DecisionsTab: React.FC<DecisionsTabProps> = ({ decisions }) => {
  const confirmedDecisions = decisions.filter((d) => d.status === 'confirmed');
  const proposalsAndSuggestions = decisions.filter((d) => d.status === 'proposal_suggestion');

  // Collect any pending approvals across decisions
  const pendingApprovals = decisions.flatMap((d) => d.pendingApprovals || []);

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Key Decisions & Alignment Registry</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {confirmedDecisions.length} Confirmed
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {proposalsAndSuggestions.length} Under Review
          </span>
        </div>
      </div>

      {/* Confirmed Decisions Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Confirmed Decisions & Agreements ({confirmedDecisions.length})</span>
        </h4>

        <div className="space-y-3">
          {confirmedDecisions.map((dec) => (
            <div
              key={dec.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {dec.decision}
                    </h5>
                    <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                      Binding Agreement
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Context & Discussion:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {dec.context}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Anticipated Impact:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {dec.impact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposals, Suggestions & Pending Approvals */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Proposals & Suggestions Under Consideration ({proposalsAndSuggestions.length})</span>
        </h4>

        <div className="space-y-3">
          {proposalsAndSuggestions.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-900/40 shadow-xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {prop.decision}
                  </h5>
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60">
                    Proposal / Needs Approval
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Context:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {prop.context}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Impact:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {prop.impact}
                  </p>
                </div>
              </div>

              {/* Pending Approvals */}
              {prop.pendingApprovals && prop.pendingApprovals.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Required Sign-off:{' '}
                    <strong>{prop.pendingApprovals.join(', ')}</strong>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
