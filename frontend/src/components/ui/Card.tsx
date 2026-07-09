import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-cream-card border border-line rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}
