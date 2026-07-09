import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';

export function ClienteLayout({ children }: { children: ReactNode }) {
  const { cliente } = useClienteAuth();

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-vanilla/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cocoa bg-straw">
              <span className="h-2 w-2 rounded-full bg-herb" />
            </span>
            <span className="font-display text-lg font-semibold leading-none text-ink">Sabor de Casa</span>
          </Link>

          <nav className="flex items-center gap-5 text-xs font-semibold">
            <Link to="/" className="hidden text-ink hover:text-herb-dark md:inline">
              Cardápio
            </Link>
            <a href="/#como-funciona" className="hidden text-ink hover:text-herb-dark md:inline">
              Como funciona
            </a>
            <a href="/#cardapio-semana" className="hidden text-ink hover:text-herb-dark md:inline">
              Planos
            </a>
            <Link to={cliente ? '/meus-pedidos' : '/login'} className="text-herb-dark hover:text-herb">
              {cliente ? cliente.nome.split(' ')[0] : 'Entrar'}
            </Link>
            <a href="/#cardapio-semana" className="rounded-lg bg-herb px-4 py-2 text-cream-card hover:bg-herb-dark">
              Pedir agora
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-57px)] w-full max-w-5xl px-4 py-5 sm:px-6">
        {children}
      </main>
    </div>
  );
}
