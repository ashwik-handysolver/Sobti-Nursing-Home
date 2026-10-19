import React from 'react';
import { CalendarCheck, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Logo } from '../ui';
import { BRAND_POSTER, BrandVideo, useBrandVideo } from './BrandVideo';

const FEATURES = [
  { icon: TrendingUp, text: 'Conversion estimates' },
  { icon: TrendingDown, text: 'Why leads are lost' },
  { icon: CalendarCheck, text: 'Follow-up reminders' },
];

// Left panel of the login card on wide screens: the clinic's footage behind a navy wash,
// with what the app is for written over it
export const AuthShowcase: React.FC = () => {
  const showVideo = useBrandVideo();

  return (
    <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 min-w-0 overflow-hidden bg-[#0b2550] text-white border-r border-slate-900/10 shadow-[inset_-1px_0_0_rgba(255,255,255,0.08)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {showVideo ? (
          <BrandVideo />
        ) : (
          // Reduced motion: the still frame instead of the footage
          <img src={BRAND_POSTER} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Navy wash: lighter at the top so the footage shows, darkest behind the text */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d2f66]/55 via-[#0b2550]/75 to-[#081a3a]/95" />
      </div>

      <div className="relative space-y-5">
        <Logo tone="light" size="lg" className="self-start" />
        <span className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 ring-1 ring-white/25 shadow-md shadow-black/20 backdrop-blur">
          Clinic CRM &amp; Patient Portal
        </span>
      </div>

      <div className="relative">
        <h1 className="text-[2.2rem] xl:text-[2.8rem] font-semibold leading-[1.12] tracking-tight text-balance">
          Turn every consultation into a booked treatment.
        </h1>
        <p className="mt-4 max-w-lg text-base xl:text-lg leading-relaxed text-white/80">
          See which patients are likely to go ahead, what is holding the rest back, and who your clinic team should call next.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/25 shadow-md shadow-black/20 backdrop-blur"
            >
              <Icon className="w-4 h-4 text-sky-300" />
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-10 flex items-center gap-2 text-sm text-white/65">
          <ShieldCheck className="w-4 h-4" />
          Patient data is private to your clinic account.
        </p>
      </div>
    </aside>
  );
};
