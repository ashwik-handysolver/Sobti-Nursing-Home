import React from 'react';
import { Pencil } from 'lucide-react';
import { Button, IconButton, muted, TextArea, TextInput } from './ui';

// List fields are edited as plain text, one item per line
export const toLines = (items: string[]) => items.join('\n');
export const fromLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const EditButton: React.FC<{ onClick: () => void; label: string; className?: string }> = ({
  onClick,
  label,
  className = '',
}) => (
  <IconButton type="button" onClick={onClick} className={`shrink-0 ${className}`} title={label} aria-label={label}>
    <Pencil className="w-4 h-4" />
  </IconButton>
);

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}> = ({ label, value, onChange, autoFocus }) => (
  <label className="block min-w-0">
    <span className={`${muted} block mb-1`}>{label}</span>
    <TextInput
      type="text"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

export const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  autoFocus?: boolean;
}> = ({ label, value, onChange, rows = 4, hint, autoFocus }) => (
  <label className="block">
    <span className={`${muted} block mb-1`}>
      {label}
      {hint && <span className="text-gray-400"> · {hint}</span>}
    </span>
    <TextArea
      value={value}
      rows={rows}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      className="leading-relaxed resize-y"
    />
  </label>
);

export const LinesField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}> = ({ label, value, onChange, autoFocus }) => (
  <TextAreaField
    label={label}
    hint="one per line"
    value={value}
    onChange={onChange}
    autoFocus={autoFocus}
    rows={Math.max(3, value.split('\n').length + 1)}
  />
);

export const FormActions: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <div className="flex items-center justify-end gap-2">
    <Button variant="ghost" type="button" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit">
      Save
    </Button>
  </div>
);
