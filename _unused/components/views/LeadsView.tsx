import React, { useMemo, useState } from 'react';
import {
  PieChart,
  ArrowRight,
  Users,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { ClientLead } from '../../types/meeting';

interface LeadsViewProps {
  clients: ClientLead[];
  onNavigateToPatients: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  clients,
  onNavigateToPatients,
}) => {
  const [conversionTierFilter, setConversionTierFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Compute conversion analytics for the Conversion Likelihood Distribution chart
  const analytics = useMemo(() => {
    const total = clients.length;
    if (total === 0) {
      return {
        avgConversionChance: 0,
        highLikelihoodCount: 0,
        mediumLikelihoodCount: 0,
        lowLikelihoodCount: 0,
      };
    }

    const avgChance = Math.round(
      clients.reduce((acc, c) => acc + (c.conversionChance || 0), 0) / total
    );

    const high = clients.filter((c) => (c.conversionChance || 0) >= 75).length;
    const med = clients.filter(
      (c) => (c.conversionChance || 0) >= 50 && (c.conversionChance || 0) < 75
    ).length;
    const low = clients.filter((c) => (c.conversionChance || 0) < 50).length;

    return {
      avgConversionChance: avgChance,
      highLikelihoodCount: high,
      mediumLikelihoodCount: med,
      lowLikelihoodCount: low,
    };
  }, [clients]);

  // Donut chart calculations
  const totalLeadsCount = clients.length || 1;
  const highRatio = analytics.highLikelihoodCount / totalLeadsCount;
  const medRatio = analytics.mediumLikelihoodCount / totalLeadsCount;
  const lowRatio = analytics.lowLikelihoodCount / totalLeadsCount;

  const circumference = 2 * Math.PI * 40; // r = 40 => ~251.3
  const highDash = highRatio * circumference;
  const medDash = medRatio * circumference;
  const lowDash = lowRatio * circumference;

  // Filtered preview based on selected donut tier
  const filteredClients = useMemo(() => {
    if (conversionTierFilter === 'high') {
      return clients.filter((c) => (c.conversionChance || 0) >= 75);
    }
    if (conversionTierFilter === 'medium') {
      return clients.filter((c) => (c.conversionChance || 0) >= 50 && (c.conversionChance || 0) < 75);
    }
    if (conversionTierFilter === 'low') {
      return clients.filter((c) => (c.conversionChance || 0) < 50);
    }
    return clients;
  }, [clients, conversionTierFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header - No descriptive text below heading, no graphical charts button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Patient Leads & Conversion
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            {clients.length} Leads
          </span>
        </div>

        <button
          onClick={onNavigateToPatients}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Users className="w-4 h-4" />
          <span>View Patients</span>
        </button>
      </div>

      {/* SOLE CHART ON PAGE: Conversion Likelihood Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Conversion Likelihood Distribution
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {clients.length} Total Patient Leads
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-2">
          {/* SVG Donut Chart */}
          <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="12"
                fill="none"
              />
              {/* Low tier arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${lowDash} ${circumference}`}
                strokeDashoffset="0"
                fill="none"
              />
              {/* Med tier arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#6366f1"
                strokeWidth="12"
                strokeDasharray={`${medDash} ${circumference}`}
                strokeDashoffset={`-${lowDash}`}
                fill="none"
              />
              {/* High tier arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${highDash} ${circumference}`}
                strokeDashoffset={`-${lowDash + medDash}`}
                fill="none"
              />
            </svg>
            {/* Donut Center Display */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {analytics.avgConversionChance}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Avg Probability
              </span>
            </div>
          </div>

          {/* Donut Legend with Interactive Quick Filters */}
          <div className="space-y-3 w-full md:max-w-md flex-1">
            <button
              onClick={() => setConversionTierFilter(conversionTierFilter === 'high' ? 'all' : 'high')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                conversionTierFilter === 'high'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  High Chance (≥75%)
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {analytics.highLikelihoodCount} ({Math.round(highRatio * 100)}%)
              </span>
            </button>

            <button
              onClick={() => setConversionTierFilter(conversionTierFilter === 'medium' ? 'all' : 'medium')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                conversionTierFilter === 'medium'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Moderate (50-74%)
                </span>
              </div>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {analytics.mediumLikelihoodCount} ({Math.round(medRatio * 100)}%)
              </span>
            </button>

            <button
              onClick={() => setConversionTierFilter(conversionTierFilter === 'low' ? 'all' : 'low')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                conversionTierFilter === 'low'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  At-Risk (&lt;50%)
                </span>
              </div>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {analytics.lowLikelihoodCount} ({Math.round(lowRatio * 100)}%)
              </span>
            </button>
          </div>
        </div>

        {/* Lead Probability Breakdown Bars */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Patient Probability Tiers ({filteredClients.length})</span>
            {conversionTierFilter !== 'all' && (
              <button
                onClick={() => setConversionTierFilter('all')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Show All
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {filteredClients.map((client) => {
              const chance = client.conversionChance || 0;
              const barGradient =
                chance >= 75
                  ? 'from-emerald-500 to-teal-400'
                  : chance >= 50
                  ? 'from-indigo-500 to-blue-400'
                  : 'from-amber-500 to-orange-400';
              const badgeColor =
                chance >= 75
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                  : chance >= 50
                  ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60'
                  : 'text-amber-600 bg-amber-50 dark:bg-amber-950/60';

              return (
                <div
                  key={client.id}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {client.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        • {client.procedureName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {client.stage}
                      </span>
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${badgeColor}`}>
                        {chance}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                      style={{ width: `${Math.max(6, chance)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIEW PATIENTS BUTTON AT THE BOTTOM OF THE PAGE */}
      <div className="pt-4 flex justify-center sm:justify-end">
        <button
          onClick={onNavigateToPatients}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all hover:translate-x-0.5 cursor-pointer active:scale-95"
        >
          <span>View Patients</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
