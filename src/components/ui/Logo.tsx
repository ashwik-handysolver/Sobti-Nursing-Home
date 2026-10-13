import React from 'react';

const CLINIC_NAME = 'Sobti Nursing Home & Lasik Laser Centre';

// The clinic emblem redrawn as vector shapes (the supplied image is only ~100px wide and
// has a white background), so it stays sharp at any size and on either theme.
const Emblem: React.FC = () => (
  <svg viewBox="10 7 74 67" className="h-8 w-auto shrink-0" fill="none" strokeWidth="6" aria-hidden="true">
    <g className="stroke-[#2165ab] dark:stroke-[#4f93e0]" strokeLinejoin="miter">
      <path d="M57.5 17V12H35.5V33" />
      <path d="M21 31.5H15V50H35.5V69H57.5V64" />
      <path d="M57 27V31.5H78V50H57V55" />
    </g>
    <g className="stroke-[#18ab95] dark:stroke-[#2cc4ad]">
      <path d="M41 21H68" />
      <path d="M31 19C22 23 20 38 33 41H60C66 41 69 43 70 46" />
      <path d="M41 59H60C66 59 69 57 70 54" />
      <path d="M22 60H30" />
    </g>
  </svg>
);

// `nameClassName` lets a caller hide the name (e.g. a collapsed sidebar).
export const Logo: React.FC<{ nameClassName?: string; className?: string }> = ({ nameClassName = '', className = '' }) => (
  <span role="img" aria-label={CLINIC_NAME} className={`flex items-center gap-2.5 min-w-0 ${className}`}>
    <Emblem />
    <span
      aria-hidden="true"
      style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
      className={`text-xs font-extrabold uppercase leading-tight tracking-wide whitespace-nowrap text-[#1f5fae] dark:text-gray-100 ${nameClassName}`}
    >
      <span className="block">Sobti Nursing Home</span>
      <span className="block">&amp; Lasik Laser Centre</span>
    </span>
  </span>
);
