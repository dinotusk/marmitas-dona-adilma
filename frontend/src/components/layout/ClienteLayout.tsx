import type { ReactNode } from 'react';

export function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-cream-card">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-baseline gap-2">
          <span className="font-display text-2xl text-ink">Dona Adilma</span>
          <span className="badge-pill text-[10px] px-2 py-0.5 rounded-full bg-herb/10 text-herb-dark">
            marmitas congeladas
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
