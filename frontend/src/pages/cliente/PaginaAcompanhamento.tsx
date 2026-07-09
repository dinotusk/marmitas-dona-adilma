import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPedidoBadge, StatusUnidadeBadge } from '@/components/ui/StatusBadge';
import { api, ApiError } from '@/lib/api';
import type { Pedido } from '@/types/domain';

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

export function PaginaAcompanhamento() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPedido = useCallback(() => {
    if (!id) return;
    api
      .get<Pedido>(`/pedidos/${id}`)
      .then(setPedido)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o pedido'))
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    carregarPedido();
    const intervalo = setInterval(carregarPedido, 20000);
    return () => clearInterval(intervalo);
  }, [carregarPedido]);

  return (
    <ClienteLayout>
      <h1 className="font-display text-3xl text-ink mb-1">Seu pedido</h1>
      <p className="text-ink-soft mb-6">Acompanhe o status da sua marmita em tempo real.</p>

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

      {pedido && !carregando && (
        <div className="grid gap-4">
          <Card className="flex justify-between items-center">
            <div>
              <p className="text-xs text-ink-soft">Pedido</p>
              <p className="font-mono text-ink">#{pedido.id.slice(0, 8)}</p>
            </div>
            <StatusPedidoBadge status={pedido.status} />
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Itens</h2>
            <div className="flex flex-col gap-2">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-ink">
                    {item.quantidade}x {item.itemCardapio.sabor}
                  </span>
                  <StatusUnidadeBadge status={item.statusUnidade} />
                </div>
              ))}
            </div>
            <div className="border-t border-line mt-3 pt-3 flex justify-between items-center">
              <span className="font-medium text-ink">Total</span>
              <span className="font-mono text-herb-dark font-medium">
                R$ {Number(pedido.valorTotal).toFixed(2)}
              </span>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Entrega</h2>
            <p className="text-sm text-ink-soft">{pedido.cliente.nome} · {pedido.cliente.telefone}</p>
            <p className="text-sm text-ink-soft mt-1">{pedido.cliente.endereco}</p>
            <p className="text-sm text-ink-soft mt-1">
              Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}
            </p>
            {pedido.observacoes && (
              <p className="text-sm text-ink-soft mt-1">Obs: {pedido.observacoes}</p>
            )}
          </Card>

          <Link to="/" className="text-sm text-herb-dark hover:underline text-center">
            Fazer outro pedido
          </Link>
        </div>
      )}
    </ClienteLayout>
  );
}
