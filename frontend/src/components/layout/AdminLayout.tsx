import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

const NAV_ITEMS = [
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/cardapio', label: 'Cardápio' },
  { to: '/admin/producao', label: 'Produção' },
  { to: '/admin/financeiro', label: 'Financeiro' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-line bg-cream-card flex flex-col">
        <div className="px-5 py-5 border-b border-line">
          <span className="font-display text-xl text-ink">Dona Dilma</span>
          <span className="block text-xs text-ink-soft mt-0.5">painel admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-herb/15 text-herb-dark' : 'text-ink-soft hover:bg-parchment-dark'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-line">
          <p className="text-xs text-ink-soft mb-2 truncate">{admin?.nome}</p>
          <Button variant="ghost" onClick={logout} className="w-full text-xs py-1.5">
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6 overflow-y-auto">{children}</main>
    </div>
  );
}
