import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';

export function ClienteLayout({ children }: { children: ReactNode }) {
  const { cliente } = useClienteAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-cream-card">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <Link to="/" className="font-display text-2xl text-ink">
              Dona Adilma
            </Link>
            <span className="badge-pill text-[10px] px-2 py-0.5 rounded-full bg-herb/10 text-herb-dark">
              marmitas congeladas
            </span>
          </div>
          <Link to={cliente ? '/meus-pedidos' : '/login'} className="text-sm text-herb-dark hover:underline">
            {cliente ? cliente.nome.split(' ')[0] : 'Entrar'}
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
