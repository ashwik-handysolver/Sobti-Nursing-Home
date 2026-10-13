import React from 'react';
import { linkClass } from './styles';

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'link';
type ButtonSize = 'md' | 'sm';

const BUTTON_BASE =
  'inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'gap-2 px-4 py-2 rounded-lg text-sm',
  sm: 'gap-1.5 px-3 py-1.5 rounded-md text-xs',
};

const BUTTON_VARIANTS: Record<Exclude<ButtonVariant, 'link'>, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
  outline:
    'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => (
  <button
    {...props}
    className={`${
      variant === 'link' ? linkClass : `${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]}`
    } ${className}`}
  />
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'default' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({ tone = 'default', className = '', ...props }) => (
  <button
    {...props}
    className={`p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
      tone === 'danger'
        ? 'hover:text-rose-600 dark:hover:text-rose-400'
        : 'hover:text-gray-700 dark:hover:text-gray-200'
    } ${className}`}
  />
);

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

// Pill-shaped filter toggle
export const Chip: React.FC<ChipProps> = ({ active, className = '', ...props }) => (
  <button
    {...props}
    aria-pressed={active}
    className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
      active
        ? 'bg-blue-600 border-blue-600 text-white font-medium'
        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    } ${className}`}
  />
);
