import React from 'react';
import { X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  message: string;
  undo?: () => void;
}

export const Toast: React.FC<{ toast: ToastMessage | null; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm" role="status" aria-live="polite">
      <div className="flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg border border-gray-700 dark:border-gray-200">
        <span className="flex-1 min-w-0 text-sm truncate">{toast.message}</span>
        {toast.undo && (
          <button
            onClick={() => {
              toast.undo!();
              onDismiss();
            }}
            className="text-sm font-semibold text-blue-400 dark:text-blue-600 hover:underline cursor-pointer"
          >
            Undo
          </button>
        )}
        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-gray-400 hover:text-white dark:hover:text-gray-900 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
