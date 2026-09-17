'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';
import clsx from 'clsx';

interface WrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, hint, error, required, htmlFor, children }: WrapperProps) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-msg">{error}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, required, id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      <input ref={ref} id={inputId} className={clsx('input', error && 'error', className)} {...props} />
    </FieldWrapper>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, required, rows = 4, id, ...props },
  ref
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} htmlFor={textareaId}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={clsx('textarea', error && 'error', className)}
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
  { label, hint, error, className, required, options, placeholder, id, ...props },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} htmlFor={selectId}>
      <select ref={ref} id={selectId} className={clsx('select', className)} {...props}>
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
    <div className="field">
      {label && <label>{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="pill"
              style={
                active
                  ? { background: 'var(--surface-tint)', color: 'var(--portal-action)', borderColor: 'var(--portal-action)' }
                  : { background: '#fff', color: 'var(--text-body)', borderColor: 'var(--border-card)' }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
