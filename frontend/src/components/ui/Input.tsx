import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-surface border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? 'border-status-critical bg-status-critical-tint/30' : 'border-border hover:border-[#CBD2D9]'
          } ${className}`}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
        {error && <p className="mt-1 text-xs font-medium text-status-critical">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, rows = 3, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={`w-full bg-surface border rounded-xl p-3.5 text-sm text-text-primary placeholder:text-text-secondary/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? 'border-status-critical bg-status-critical-tint/30' : 'border-border hover:border-[#CBD2D9]'
          } ${className}`}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
        {error && <p className="mt-1 text-xs font-medium text-status-critical">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
