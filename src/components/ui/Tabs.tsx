import React from 'react';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  badge?: string | number; // small count or score beside the label
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly TabOption<T>[];
  className?: string;
  'aria-label'?: string;
}

// Underlined tab bar for switching between sections of one screen
export function Tabs<T extends string>({ value, onChange, options, className = '', 'aria-label': ariaLabel }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex sm:gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto [scrollbar-width:none] ${className}`}
    >
      {options.map(({ id, label, icon: Icon, badge }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-2.5 -mb-px border-b-2 text-sm whitespace-nowrap transition-colors cursor-pointer ${
              selected
                ? 'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 font-medium'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 hidden sm:block" />}
            <span>{label}</span>
            {badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium tabular-nums text-gray-600 dark:text-gray-300">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
