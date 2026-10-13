import React from 'react';
import { Card } from './Card';
import { muted } from './styles';

// Headline number with a short note beneath it
export const StatTile: React.FC<{
  label: string;
  value: string;
  note?: React.ReactNode;
  onClick?: () => void;
}> = ({ label, value, note, onClick }) => (
  <Card
    onClick={onClick}
    className={`p-4 sm:p-5 ${
      onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors' : ''
    }`}
  >
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{value}</div>
    {note && <div className={`${muted} mt-1`}>{note}</div>}
  </Card>
);

export interface ChartItem {
  label: string;
  value: number;
}

// Round axis steps (1, 2, 5, 10, 20, 25, 50, …) so the gridlines land on whole numbers
function axisTicks(max: number): number[] {
  const target = Math.max(max, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = Math.max(1, [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= target)!);
  const top = Math.ceil(Math.max(max, 1) / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return ticks;
}

// Vertical bars for comparing a handful of categories; every bar carries its value.
// `unit` is the singular noun being counted (e.g. "lead").
export const ColumnChart: React.FC<{ items: ChartItem[]; unit: string }> = ({ items, unit }) => {
  const ticks = axisTicks(Math.max(...items.map((i) => i.value), 0));
  const top = ticks[ticks.length - 1];
  const describe = (item: ChartItem) => `${item.label}: ${item.value} ${unit}${item.value === 1 ? '' : 's'}`;
  const columns = 'flex-1 flex justify-around gap-2 px-2';

  return (
    <figure className="mt-6" role="img" aria-label={items.map(describe).join(', ')}>
      <div className="flex gap-2 h-48">
        <div className="relative w-7 shrink-0">
          {ticks.map((tick) => (
            <span
              key={tick}
              className={`${muted} absolute right-0 translate-y-1/2 tabular-nums`}
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="relative flex-1 flex border-b border-gray-300 dark:border-gray-600">
          {ticks.slice(1).map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-dashed border-gray-200 dark:border-gray-700/70"
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}
          <div className={`relative ${columns} items-end`}>
            {items.map((item) => (
              <div
                key={item.label}
                title={describe(item)}
                className="relative flex-1 max-w-16 rounded-t bg-[var(--viz-s1)] hover:opacity-85 transition-opacity"
                style={{ height: `${(item.value / top) * 100}%`, minHeight: 2 }}
              >
                <span className="absolute -top-5 inset-x-0 text-center text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <div className="w-7 shrink-0" />
        <div className={columns}>
          {items.map((item) => (
            <span key={item.label} className="flex-1 max-w-16 text-center text-xs text-gray-600 dark:text-gray-300 leading-tight">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
};

// Horizontal bars, one row per item, each measured against `total`
export const BarList: React.FC<{
  items: ChartItem[];
  total: number;
  totalLabel: string; // what the percentage is a share of, for the tooltip
  color: (index: number) => string;
  showShare?: (index: number) => boolean;
}> = ({ items, total, totalLabel, color, showShare = () => true }) => (
  <ol className="mt-4 space-y-4">
    {items.map((item, i) => {
      const share = total ? Math.round((item.value / total) * 100) : 0;
      return (
        <li key={item.label} title={`${item.label}: ${item.value} (${share}% of ${totalLabel})`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
            <span className="tabular-nums text-gray-900 dark:text-gray-100">
              {item.value}
              {showShare(i) && <span className={`${muted} ml-1.5`}>{share}%</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${share}%`, background: color(i) }} />
          </div>
        </li>
      );
    })}
  </ol>
);

// The steps of a funnel, each measured against the first; the final step is picked out
export const FunnelBars: React.FC<{ steps: ChartItem[] }> = ({ steps }) => (
  <BarList
    items={steps}
    total={steps[0]?.value || 0}
    totalLabel={(steps[0]?.label || '').toLowerCase()}
    color={(i) => (i === steps.length - 1 ? 'var(--viz-s2)' : 'var(--viz-s1)')}
    showShare={(i) => i > 0}
  />
);
