import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { card } from './styles';

interface ModalProps {
  title: string;
  icon?: React.ElementType;
  onClose: () => void;
  closeOnBackdrop?: boolean; // turn off for forms, where a stray click would lose what was typed
  className?: string; // width, e.g. "max-w-xl"
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  icon: Icon,
  onClose,
  closeOnBackdrop = true,
  className = 'max-w-lg',
  children,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 overflow-y-auto"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className={`${card} w-full ${className} p-5 shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
            <span>{title}</span>
          </h2>
          <IconButton onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
};
