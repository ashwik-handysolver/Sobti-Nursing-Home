import React from 'react';
import { Search } from 'lucide-react';
import { inputClass, inputClassSm } from './styles';

type FieldSize = 'md' | 'sm'; // 'sm' is the compact style used inside dialogs

const FIELD_SIZES: Record<FieldSize, string> = { md: inputClass, sm: inputClassSm };

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: FieldSize;
  ref?: React.Ref<HTMLInputElement>;
}

export const TextInput: React.FC<TextInputProps> = ({ size = 'md', className = '', type = 'text', ...props }) => (
  <input {...props} type={type} className={`${FIELD_SIZES[size]} ${className}`} />
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: FieldSize;
}

export const TextArea: React.FC<TextAreaProps> = ({ size = 'md', className = '', ...props }) => (
  <textarea {...props} className={`${FIELD_SIZES[size]} ${className}`} />
);

// Text input with a leading search icon; `trailing` sits inside the right edge (e.g. a shortcut hint)
export const SearchInput: React.FC<TextInputProps & { wrapperClassName?: string; trailing?: React.ReactNode }> = ({
  wrapperClassName = 'flex-1',
  trailing,
  className = '',
  ...props
}) => (
  <div className={`relative ${wrapperClassName}`}>
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <TextInput {...props} className={`pl-9 ${className}`} />
    {trailing}
  </div>
);

// Label stacked above a form control
export const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className = '',
  children,
}) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children}
  </div>
);

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly (T | DropdownOption<T>)[]; // a bare string is both value and label
  size?: FieldSize;
  className?: string;
  'aria-label'?: string;
}

export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}: DropdownProps<T>) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  // A saved value that is no longer offered stays selectable instead of silently changing
  const isKnown = !value || items.some((o) => o.value === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-label={ariaLabel}
      className={`${FIELD_SIZES[size]} cursor-pointer ${className}`}
    >
      {!isKnown && <option value={value}>{value}</option>}
      {items.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  disabled?: boolean;
  iconOnlyBelowLg?: boolean; // hide labels on smaller screens when every option has an icon
  className?: string;
  'aria-label'?: string;
}

// Mutually exclusive choice shown as a row of joined buttons
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  disabled,
  iconOnlyBelowLg,
  className = '',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          title={iconOnlyBelowLg ? label : undefined}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
            value === id
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span className={iconOnlyBelowLg ? 'hidden lg:inline' : ''}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// The sliding pill on its own, for rows that are themselves the switch button
export const SwitchTrack: React.FC<{ checked: boolean; className?: string }> = ({ checked, className = '' }) => (
  <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'} ${className}`}>
    <span
      className={`block w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </span>
);

export const Switch: React.FC<{ checked: boolean; onChange: () => void; 'aria-label': string }> = ({
  checked,
  onChange,
  'aria-label': ariaLabel,
}) => (
  <button onClick={onChange} role="switch" aria-checked={checked} aria-label={ariaLabel} className="flex cursor-pointer">
    <SwitchTrack checked={checked} />
  </button>
);
