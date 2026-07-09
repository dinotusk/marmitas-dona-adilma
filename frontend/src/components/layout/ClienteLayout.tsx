import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';

export function ClienteLayout({ children }: { children: ReactNode }) {
  const { cliente } = useClienteAuth();

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-parchment/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cocoa text-sm font-display text-vanilla">
              DA
            </span>
            <span>
              <span className="block font-display text-xl leading-none text-ink">Dona Adilma</span>
              <span className="mt-1 block text-xs text-ink-soft">Sabor de Casa</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link to="/" className="hidden text-ink-soft hover:text-herb-dark sm:inline">
              Cardápio
            </Link>
            <Link to={cliente ? '/meus-pedidos' : '/login'} className="rounded-lg bg-herb px-4 py-2 text-cream-card hover:bg-herb-dark">
              {cliente ? cliente.nome.split(' ')[0] : 'Entrar'}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-73px)] w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
