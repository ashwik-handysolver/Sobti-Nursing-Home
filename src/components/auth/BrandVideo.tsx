import React, { useEffect, useState } from 'react';

// A 13-second loop cut from the clinic's commercial (public/Website-Comercial.mp4): the iris
// close-up, the laser workstation and operating microscope, then the laser from another angle,
// with the fades between them built in. Re-encoded at 1280×720 without sound, it is under 4 MB
// (the original is 32 MB), so it plays straight through instead of stalling while it downloads.
export const BRAND_LOOP = '/login-loop.mp4';
export const BRAND_POSTER = '/login-poster.jpg'; // the iris close-up, shown until the video can play

// Fills its (positioned) parent
export const BrandVideo: React.FC = () => (
  <video
    src={BRAND_LOOP}
    poster={BRAND_POSTER}
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    aria-hidden="true"
    className="absolute inset-0 w-full h-full object-cover"
  />
);

// The video only plays on wide screens (where the showcase is visible) and not for people
// who have asked their system to reduce motion, so phones never download it
export const useBrandVideo = () => {
  const query = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
  const [show, setShow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setShow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return show;
};
