import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`px-3.5 py-2.5 rounded-xl border bg-cream-card text-ink
          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb
          ${error ? 'border-paprika' : 'border-line'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-paprika-dark">{error}</span>}
    </div>
  );
}
