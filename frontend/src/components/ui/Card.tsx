import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-cream-card p-4 shadow-[0_1px_0_rgba(36,27,15,0.04)] sm:p-5 ${className}`}>
      {children}
    </div>
  );
}
