import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ConversionPoint } from '../../types/meeting';

interface ConversionTimelineChartProps {
  points: ConversionPoint[];
  totalSeconds: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

const HEIGHT = 240;
const MARGIN = { top: 34, right: 20, bottom: 26, left: 40 };
const Y_TICKS = [0, 25, 50, 75, 100];

const formatClock = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const ConversionTimelineChart: React.FC<ConversionTimelineChartProps> = ({
  points,
  totalSeconds,
  currentTime,
  onSeek,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Measure straight away so the chart is drawn on the first frame, then track resizes
    setWidth(host.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(
    () => [...points].sort((a, b) => a.seconds - b.seconds),
    [points]
  );
  const span = Math.max(totalSeconds, data[data.length - 1]?.seconds || 0, 1);

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (seconds: number) => MARGIN.left + (seconds / span) * plotW;
  const y = (score: number) => MARGIN.top + (1 - score / 100) * plotH;

  // Highest and lowest moments; the earliest wins a tie
  const peakIndex = data.reduce((best, p, i) => (p.score > data[best].score ? i : best), 0);
  const lowIndex = data.reduce((best, p, i) => (p.score < data[best].score ? i : best), 0);
  const isFlat = data[peakIndex]?.score === data[lowIndex]?.score;

  const xTicks = useMemo(() => {
    const step = span <= 120 ? 30 : span <= 600 ? 60 : span <= 1800 ? 300 : 600;
    const list: number[] = [];
    for (let t = 0; t <= span; t += step) list.push(t);
    return list;
  }, [span]);

  if (data.length < 2) return null;

  // The last estimate holds until the conversation ends
  const last = data[data.length - 1];
  const linePath =
    data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.seconds)},${y(p.score)}`).join(' ') + ` L${x(span)},${y(last.score)}`;
  const areaPath = `${linePath} L${x(span)},${y(0)} L${x(data[0].seconds)},${y(0)} Z`;

  const nearestIndex = (clientX: number) => {
    const box = hostRef.current!.getBoundingClientRect();
    const px = clientX - box.left;
    return data.reduce((best, p, i) => (Math.abs(x(p.seconds) - px) < Math.abs(x(data[best].seconds) - px) ? i : best), 0);
  };

  // Keep a label inside the plot: anchor it away from the nearest edge
  const anchorFor = (px: number) => (px < MARGIN.left + 70 ? 'start' : px > width - MARGIN.right - 70 ? 'end' : 'middle');

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const callouts = isFlat
    ? []
    : [
        { kind: 'Highest', icon: TrendingUp, point: data[peakIndex] },
        { kind: 'Lowest', icon: TrendingDown, point: data[lowIndex] },
      ];

  return (
    <div>
      <div
        ref={hostRef}
        className="relative mt-4 select-none"
        style={{ height: HEIGHT }}
        onMouseMove={(e) => setHoverIndex(nearestIndex(e.clientX))}
        onMouseLeave={() => setHoverIndex(null)}
        onClick={(e) => onSeek(data[nearestIndex(e.clientX)].seconds)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Conversion likelihood over the conversation" className="block cursor-pointer">
            {/* Grid and axes */}
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  className={tick === 0 ? 'stroke-gray-300 dark:stroke-gray-600' : 'stroke-gray-100 dark:stroke-gray-700'}
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-gray-500 dark:fill-gray-400 text-[11px] tabular-nums"
                >
                  {tick}%
                </text>
              </g>
            ))}
            {xTicks.map((tick) => (
              <text
                key={tick}
                x={x(tick)}
                y={HEIGHT - 8}
                textAnchor={tick === 0 ? 'start' : 'middle'}
                className="fill-gray-500 dark:fill-gray-400 text-[11px] tabular-nums"
              >
                {formatClock(tick)}
              </text>
            ))}

            {/* Series */}
            <path d={areaPath} fill="var(--viz-s1)" opacity={0.1} />
            <path d={linePath} fill="none" stroke="var(--viz-s1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Playback position */}
            {currentTime > 0 && currentTime <= span && (
              <line
                x1={x(currentTime)}
                x2={x(currentTime)}
                y1={MARGIN.top}
                y2={y(0)}
                className="stroke-gray-900 dark:stroke-gray-100"
                strokeWidth={1}
              />
            )}

            {/* Hover crosshair */}
            {hovered && (
              <line
                x1={x(hovered.seconds)}
                x2={x(hovered.seconds)}
                y1={MARGIN.top}
                y2={y(0)}
                className="stroke-gray-400 dark:stroke-gray-500"
                strokeWidth={1}
              />
            )}

            {/* Points; the peak and the low are larger and labelled */}
            {data.map((p, i) => {
              const marked = !isFlat && (i === peakIndex || i === lowIndex);
              return (
                <circle
                  key={i}
                  cx={x(p.seconds)}
                  cy={y(p.score)}
                  r={marked || hoverIndex === i ? 6 : 4}
                  fill="var(--viz-s1)"
                  className="stroke-white dark:stroke-gray-800"
                  strokeWidth={2}
                />
              );
            })}

            {!isFlat &&
              [
                { index: peakIndex, label: 'Highest', dy: -14 },
                { index: lowIndex, label: 'Lowest', dy: 22 },
              ].map(({ index, label, dy }) => {
                const p = data[index];
                const px = x(p.seconds);
                return (
                  <text
                    key={label}
                    x={px}
                    y={y(p.score) + dy}
                    textAnchor={anchorFor(px)}
                    className="fill-gray-900 dark:fill-gray-100 text-xs font-semibold"
                  >
                    {label} {p.score}% · {p.timestamp}
                  </text>
                );
              })}
          </svg>
        )}

        {hovered && (
          <div
            className="absolute z-10 w-56 -translate-x-1/2 pointer-events-none"
            style={{
              left: Math.max(116, Math.min(width - 116, x(hovered.seconds))),
              top: y(hovered.score) > HEIGHT / 2 ? y(hovered.score) - 86 : y(hovered.score) + 16,
            }}
          >
            <div className="rounded-lg px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg">
              <div className="text-xs font-semibold">
                {hovered.score}% · {hovered.timestamp}
              </div>
              {hovered.reason && <div className="text-xs mt-0.5 line-clamp-3 opacity-90">{hovered.reason}</div>}
            </div>
          </div>
        )}
      </div>

      {/* The same two moments in words, so nothing depends on hovering */}
      {callouts.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {callouts.map(({ kind, icon: Icon, point }) => (
            <button
              key={kind}
              onClick={() => onSeek(point.seconds)}
              title="Play from this moment"
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-left hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5 text-gray-500 dark:text-gray-400" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {kind}: {point.score}% at {point.timestamp}
                </span>
                {point.reason && (
                  <span className="block text-sm text-gray-600 dark:text-gray-300 mt-0.5">{point.reason}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
