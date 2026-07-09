import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-cream-card border border-line rounded-lg p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}
