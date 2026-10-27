import React from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Gift } from 'lucide-react';
import type { AppUser } from '../AuthGate';

// The referral app linked from the Refer button.
const REFERRAL_URL = 'https://referral-umber.vercel.app/';

/**
 * Link to the referral app for the signed-in user, so it knows who is referring:
 * ?referrerEmail=…&referrerName=…  The name is the one given at sign-up, else the
 * part of the email before the @.
 */
export function referralUrl(user: AppUser) {
  if (!user.email) return REFERRAL_URL;
  const name = (user.name && user.name !== user.email && user.name.trim()) || user.email.split('@')[0] || '';
  const params = new URLSearchParams({ referrerEmail: user.email, referrerName: name });
  return `${REFERRAL_URL}?${params.toString()}`;
}

// Sparkles that twinkle around the gift on hover: position (px from the gift's centre),
// size and start delay, so they light up one after another rather than all at once.
const SPARKLES = [
  { x: -11, y: -11, size: 7, delay: 0 },
  { x: 12, y: -9, size: 5, delay: 90 },
  { x: 10, y: 11, size: 6, delay: 170 },
];

/**
 * "Refer & earn" button for the bottom of the sidebar. On hover a light sheen sweeps
 * across it, the gift gives a small hop and a few sparkles twinkle around it. With the
 * sidebar collapsed (desktop only) it shrinks to the gift icon.
 */
export const ReferButton: React.FC<{ user: AppUser; isCollapsed: boolean }> = ({ user, isCollapsed }) => {
  const label = isCollapsed ? 'md:hidden' : '';
  return (
    <a
      href={referralUrl(user)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Refer and earn (opens the referral app in a new tab)"
      title={isCollapsed ? 'Refer & earn' : undefined}
      className={`refer-button group relative isolate flex h-11 items-center gap-3.5 overflow-hidden rounded-lg px-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm shadow-blue-600/30 transition-colors ${
        isCollapsed ? 'md:justify-center md:px-0' : ''
      }`}
    >
      <span className="relative grid w-5 h-5 shrink-0 place-items-center">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {SPARKLES.map((sparkle, index) => (
            <span
              key={index}
              className="refer-sparkle"
              style={
                {
                  '--sparkle-x': `${sparkle.x}px`,
                  '--sparkle-y': `${sparkle.y}px`,
                  '--sparkle-size': `${sparkle.size}px`,
                  '--sparkle-delay': `${sparkle.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <Gift className="refer-gift w-5 h-5" aria-hidden="true" />
      </span>
      <span className={`truncate ${label}`}>Refer &amp; earn</span>
      <ArrowUpRight
        aria-hidden="true"
        className={`ml-auto w-3.5 h-3.5 opacity-70 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 ${label}`}
      />
    </a>
  );
};
