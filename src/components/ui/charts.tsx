import React from 'react';
import { Card } from './Card';
import { muted } from './styles';

// Headline number with a short note beneath it
export const StatTile: React.FC<{
  label: string;
  value: string;
  note?: React.ReactNode;
  icon?: React.ElementType;
  onClick?: () => void;
}> = ({ label, value, note, icon: Icon, onClick }) => (
  <Card
    onClick={onClick}
    className={`p-4 sm:p-5 ${
      onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors' : ''
    }`}
  >
    <div className="flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>{label}</span>
      {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
    </div>
    <div className="mt-1.5 text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
      {value}
    </div>
    {note && <div className={`${muted} mt-1`}>{note}</div>}
  </Card>
);

export interface ChartItem {
  label: string;
  value: number;
}

export type MeterTone = 'brand' | 'good' | 'bad' | 'muted';

const METER_FILL: Record<MeterTone, string> = {
  brand: 'bg-[var(--viz-s1)]',
  good: 'bg-emerald-500',
  bad: 'bg-rose-500',
  muted: 'bg-gray-400 dark:bg-gray-500',
};

export interface MeterRow {
  label: string;
  percent: number; // bar length, 0-100
  value: React.ReactNode; // what the row says on the right, e.g. "60%" or "₹2.4L"
  detail?: React.ReactNode; // one quiet line under the bar
  tone?: MeterTone;
  onClick?: () => void;
}

// One labelled bar per row; the clearest way to compare a few groups on a single measure
export const MeterList: React.FC<{ rows: MeterRow[] }> = ({ rows }) => (
  <ul className="space-y-3.5">
    {rows.map((row) => {
      const content = (
        <>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{row.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">{row.value}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-700/70 overflow-hidden">
            <div
              className={`h-full rounded-full ${METER_FILL[row.tone || 'brand']}`}
              style={{ width: `${row.percent > 0 ? Math.max(2, Math.min(100, row.percent)) : 0}%` }}
            />
          </div>
          {row.detail && <div className={`${muted} mt-1`}>{row.detail}</div>}
        </>
      );
      return (
        <li key={row.label}>
          {row.onClick ? (
            <button onClick={row.onClick} className="block w-full text-left cursor-pointer group">
              {content}
            </button>
          ) : (
            content
          )}
        </li>
      );
    })}
  </ul>
);

// Each step of a funnel as a share of the first, with the drop from the step before.
// The biggest drop is picked out, since that is where leads are being lost.
export const FunnelSteps: React.FC<{ steps: ChartItem[] }> = ({ steps }) => {
  const first = steps[0]?.value || 0;
  const drops = steps.map((step, i) =>
    i === 0 || !steps[i - 1].value ? 0 : Math.round(((steps[i - 1].value - step.value) / steps[i - 1].value) * 100)
  );
  const biggest = Math.max(...drops);

  return (
    <ol className="space-y-3.5">
      {steps.map((step, i) => {
        const share = first ? Math.round((step.value / first) * 100) : 0;
        const isLast = i === steps.length - 1;
        const isWorst = drops[i] > 0 && drops[i] === biggest;
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">
                {step.label}
                {drops[i] > 0 && (
                  <span
                    className={`ml-2 text-xs tabular-nums ${
                      isWorst ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    title={`${drops[i]}% of the previous step did not reach this one`}
                  >
                    −{drops[i]}%{isWorst && ' biggest drop'}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">{step.value}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-700/70 overflow-hidden">
              <div
                className={`h-full rounded-full ${isLast ? 'bg-emerald-500' : 'bg-[var(--viz-s1)]'}`}
                style={{ width: `${share > 0 ? Math.max(2, share) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
};

// Horizontal bars, one row per item, each measured against `total`
export const BarList: React.FC<{
  items: ChartItem[];
  total: number;
  totalLabel: string; // what the percentage is a share of, for the tooltip
  color: (index: number) => string;
  showShare?: (index: number) => boolean;
  detail?: (index: number) => React.ReactNode; // shown under the bar
}> = ({ items, total, totalLabel, color, showShare = () => true, detail }) => (
  <ol className="space-y-3.5">
    {items.map((item, i) => {
      const share = total ? Math.round((item.value / total) * 100) : 0;
      return (
        <li key={item.label} title={`${item.label}: ${item.value} (${share}% of ${totalLabel})`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {item.value}
              {showShare(i) && <span className={`${muted} font-normal ml-1.5`}>{share}%</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-700/70 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${share}%`, background: color(i) }} />
          </div>
          {detail?.(i)}
        </li>
      );
    })}
  </ol>
);
