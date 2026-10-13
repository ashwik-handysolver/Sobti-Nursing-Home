import React, { useEffect, useRef, useState } from 'react';
import { card } from './styles';

interface PopoverProps {
  trigger: (state: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  className?: string; // panel width
}

// Panel anchored under its trigger; closes on outside click or Escape
export const Popover: React.FC<PopoverProps> = ({ trigger, children, className = 'w-72' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({ isOpen, toggle: () => setIsOpen((prev) => !prev) })}
      {isOpen && (
        <div className={`${card} absolute right-0 top-full mt-2 z-40 shadow-xl max-w-[calc(100vw-2rem)] ${className}`}>
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  );
};
