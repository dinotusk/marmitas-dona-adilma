import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPedidoBadge } from '@/components/ui/StatusBadge';
import { api, ApiError } from '@/lib/api';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import type { Pedido } from '@/types/domain';

export function PaginaMeusPedidos() {
  const { cliente, logout } = useClienteAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!cliente) return;
    api
      .get<Pedido[]>('/clientes/meus-pedidos', false, true)
      .then(setPedidos)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar seus pedidos'))
      .finally(() => setCarregando(false));
  }, [cliente]);

  if (!cliente) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ClienteLayout>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink mb-1">Meus pedidos</h1>
          <p className="text-ink-soft">Olá, {cliente.nome}.</p>
        </div>
        <Button variant="ghost" onClick={logout} className="text-xs py-1.5 px-3">
          Sair
        </Button>
      </div>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && !carregando && (
        <Card className="border-paprika/40">
          <p className="text-paprika-dark text-sm">{erro}</p>
        </Card>
      )}

      {!carregando && !erro && pedidos.length === 0 && (
        <Card>
          <p className="text-sm text-ink-soft">Você ainda não fez nenhum pedido.</p>
        </Card>
      )}

      <div className="grid gap-3">
        {pedidos.map((pedido) => (
          <Link key={pedido.id} to={`/pedido/${pedido.id}`}>
            <Card className="flex justify-between items-center gap-4 hover:bg-parchment-dark transition-colors">
              <div>
                <p className="font-mono text-ink">#{pedido.id.slice(0, 8)}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-ink-soft mt-1">
                  {pedido.itens.map((i) => `${i.quantidade}x ${i.itemCardapio.sabor}`).join(', ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <StatusPedidoBadge status={pedido.status} />
                <p className="font-mono text-herb-dark font-medium mt-1">
                  R$ {Number(pedido.valorTotal).toFixed(2)}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </ClienteLayout>
  );
}
