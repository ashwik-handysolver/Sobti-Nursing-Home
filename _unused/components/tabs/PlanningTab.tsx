import React from 'react';
import {
  Target,
  Milestone,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { MeetingPlan } from '../../types/meeting';

interface PlanningTabProps {
  plan: MeetingPlan;
}

export const PlanningTab: React.FC<PlanningTabProps> = ({ plan }) => {
  return (
    <div className="space-y-6">
      {/* Objective Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Target className="w-5 h-5" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Primary Meeting Objective
          </h3>
        </div>
        <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {plan.objective}
        </p>
      </div>

      {/* Execution Phases & Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Milestone className="w-4 h-4 text-indigo-600" />
            <span>Phased Execution Roadmap</span>
          </h3>
          <span className="text-xs text-slate-400">
            {plan.phases?.length || 0} sequential phases
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(plan.phases || []).map((phase, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {phase.durationOrPeriod}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {phase.phaseName}
                </h4>

                {/* Milestones list */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Milestones:
                  </span>
                  <ul className="space-y-1">
                    {phase.milestones.map((m, mIdx) => (
                      <li
                        key={mIdx}
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5"
                      >
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Deliverables */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Key Deliverables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {phase.keyDeliverables.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Timeline & Verification Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Timeline & Commitment Verification</span>
            </h3>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Stated in Audio
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              AI Suggested (Advisory)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3">Milestone / Item</th>
                <th className="py-2.5 px-3">Date / Window</th>
                <th className="py-2.5 px-3">Commitment Type</th>
                <th className="py-2.5 px-3">Audio Context / Derivation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(plan.timelineDetails || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                    {item.item}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {item.date}
                  </td>
                  <td className="py-3 px-3">
                    {item.dateType === 'stated' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        🔒 Stated in Audio
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        💡 AI Suggested
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                    {item.context}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Next Steps & Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Next Steps */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ArrowRight className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Recommended Next Steps
            </h4>
          </div>
          <div className="space-y-2.5">
            {(plan.recommendedNextSteps || []).map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
              >
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {step.step}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  {step.owner && (
                    <span>Owner: <strong className="text-slate-700 dark:text-slate-300">{step.owner}</strong></span>
                  )}
                  {step.suggestedDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.suggestedDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dependencies, Blockers & Risks */}
        <div className="space-y-4">
          {/* Dependencies */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Dependencies & Blockers
              </h4>
            </div>
            <ul className="space-y-1.5 pt-1">
              {(plan.dependenciesAndBlockers || []).map((dep, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{dep}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks & Questions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Risks & Unresolved Questions
              </h4>
            </div>
            <ul className="space-y-1.5 pt-1">
              {(plan.risksAndQuestions || []).map((risk, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
