import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

const VARIANTES = {
  primary: 'bg-herb text-cream-card hover:bg-herb-dark focus-visible:outline-herb-dark',
  secondary: 'bg-paprika text-cream-card hover:bg-paprika-dark focus-visible:outline-paprika-dark',
  ghost: 'bg-cream-card text-ink border border-line hover:bg-vanilla focus-visible:outline-ink',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        ${VARIANTES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
