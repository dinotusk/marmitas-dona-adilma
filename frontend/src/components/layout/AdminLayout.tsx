import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

const NAV_ITEMS = [
  { to: '/admin/pedidos', label: 'Visão geral' },
  { to: '/admin/cardapio', label: 'Cardápio' },
  { to: '/admin/producao', label: 'Produção' },
  { to: '/admin/financeiro', label: 'Financeiro' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/perfil', label: 'Config' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-parchment text-ink lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-cocoa text-vanilla lg:flex">
        <div className="border-b border-vanilla/10 px-6 py-6">
          <span className="block font-display text-2xl">Marmitas dona Adilma</span>
          <span className="mt-1 block text-xs text-vanilla/55">Painel administrativo</span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-herb text-cream-card' : 'text-vanilla/72 hover:bg-vanilla/10 hover:text-cream-card'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-vanilla/10 px-5 py-5">
          <p className="truncate text-sm font-semibold text-cream-card">{admin?.nome}</p>
          <p className="mt-1 truncate text-xs text-vanilla/55">{admin?.email}</p>
          <Button variant="secondary" onClick={logout} className="mt-4 w-full py-2 text-xs">
            Sair
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 bg-cocoa px-4 pb-4 pt-5 text-vanilla lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-vanilla/60">Marmitas dona Adilma</span>
              <span className="block font-display text-2xl leading-tight">Bom dia, chef</span>
              <span className="text-xs text-vanilla/60">{admin?.nome}</span>
            </div>
            <Button variant="secondary" onClick={logout} className="px-3 py-2 text-xs">
              Sair
            </Button>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                    isActive ? 'bg-herb text-cream-card' : 'bg-vanilla/10 text-vanilla/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
