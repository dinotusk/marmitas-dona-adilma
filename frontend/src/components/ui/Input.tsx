import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-ink-soft">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-10 rounded-lg border bg-cream-card px-3.5 text-sm text-ink placeholder:text-ink-soft/60
          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb
          ${error ? 'border-paprika' : 'border-line'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-paprika-dark">{error}</span>}
    </div>
  );
}
