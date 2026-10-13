import React from 'react';
import {
  Milestone,
  Target,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MeetingRecording } from '../../types/meeting';

interface AllPlansViewProps {
  recordings: MeetingRecording[];
  onOpenRecording: (recordingId: string) => void;
}

export const AllPlansView: React.FC<AllPlansViewProps> = ({
  recordings,
  onOpenRecording,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Executive Execution Plans & Roadmaps
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Organized milestones, strategic phases, and suggested timelines generated across your meetings.
        </p>
      </div>

      {/* Plans by meeting */}
      <div className="space-y-6">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
          >
            {/* Meeting Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Meeting Roadmap
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {recording.title}
                </h3>
              </div>

              <button
                onClick={() => onOpenRecording(recording.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>View Full Meeting</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Objective */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-1">
                Objective:
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                {recording.plan.objective}
              </p>
            </div>

            {/* Phases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(recording.plan.phases || []).map((phase, pIdx) => (
                <div
                  key={pIdx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {phase.phaseName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {phase.durationOrPeriod}
                    </span>
                  </div>

                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {phase.milestones.map((m, mIdx) => (
                      <li key={mIdx} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
