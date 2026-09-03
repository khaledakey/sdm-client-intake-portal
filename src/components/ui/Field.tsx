'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

const fieldBase =
  'w-full rounded-lg border border-slate/20 bg-white px-3.5 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:bg-black/5';

interface WrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWrapper({ label, hint, error, required, children }: WrapperProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-midnight">
          {label} {required && <span className="text-teal">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-mist">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, required, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <input ref={ref} className={clsx(fieldBase, error && 'border-red-400', className)} {...props} />
    </FieldWrapper>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, required, rows = 4, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(fieldBase, 'resize-y', error && 'border-red-400', className)}
        {...props}
      />
    </FieldWrapper>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, required, options, placeholder, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <select ref={ref} className={clsx(fieldBase, error && 'border-red-400', className)} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

interface MultiSelectProps {
  label?: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelect({ label, hint, options, value, onChange }: MultiSelectProps) {
  function toggle(v: string) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }
  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-midnight">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-slate/20 bg-white text-midnight hover:border-teal/40'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint && <span className="mt-1 block text-xs text-mist">{hint}</span>}
    </div>
  );
}
