import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPedidoBadge, StatusUnidadeBadge, StatusPagamentoBadge, LABELS_PEDIDO } from '@/components/ui/StatusBadge';
import { api, ApiError } from '@/lib/api';
import type { Pedido, ItemPedido, StatusPedido } from '@/types/domain';

const STATUS_OPCOES: StatusPedido[] = ['RECEBIDO', 'EM_PREPARACAO', 'PRONTO', 'SAIU_ENTREGA', 'ENTREGUE'];

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

export function PaginaPedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<StatusPedido | 'TODOS'>('TODOS');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPedidos = useCallback(() => {
    const query = filtro === 'TODOS' ? '' : `?status=${filtro}`;
    api
      .get<Pedido[]>(`/pedidos${query}`, true)
      .then(setPedidos)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os pedidos'))
      .finally(() => setCarregando(false));
  }, [filtro]);

  useEffect(() => {
    setCarregando(true);
    carregarPedidos();
    const intervalo = setInterval(carregarPedidos, 15000);
    return () => clearInterval(intervalo);
  }, [carregarPedidos]);

  async function atualizarStatus(pedidoId: string, status: StatusPedido) {
    try {
      const atualizado = await api.patch<Pedido>(`/pedidos/${pedidoId}/status`, { status }, true);
      setPedidos((atual) => atual.map((p) => (p.id === pedidoId ? atualizado : p)));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível atualizar o status do pedido');
    }
  }

  async function alternarStatusUnidade(pedidoId: string, item: ItemPedido) {
    const novoStatus = item.statusUnidade === 'PREPARANDO' ? 'PRONTA' : 'PREPARANDO';
    try {
      const atualizado = await api.patch<ItemPedido>(
        `/pedidos/${pedidoId}/itens/${item.id}`,
        { statusUnidade: novoStatus },
        true
      );
      setPedidos((atual) =>
        atual.map((p) =>
          p.id === pedidoId
            ? { ...p, itens: p.itens.map((i) => (i.id === atualizado.id ? atualizado : i)) }
            : p
        )
      );
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível atualizar o status da marmita');
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Pedidos</h1>
      <p className="text-ink-soft mb-6">Acompanhe e atualize os pedidos em andamento.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFiltro('TODOS')}
          className={`px-3 py-1.5 rounded-md border text-sm font-medium ${
            filtro === 'TODOS' ? 'border-herb bg-herb/10 text-herb-dark' : 'border-line text-ink-soft hover:bg-parchment-dark'
          }`}
        >
          Todos
        </button>
        {STATUS_OPCOES.map((status) => (
          <button
            key={status}
            onClick={() => setFiltro(status)}
            className={`px-3 py-1.5 rounded-md border text-sm font-medium ${
              filtro === status ? 'border-herb bg-herb/10 text-herb-dark' : 'border-line text-ink-soft hover:bg-parchment-dark'
            }`}
          >
            {LABELS_PEDIDO[status]}
          </button>
        ))}
      </div>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {!carregando && pedidos.length === 0 && (
        <Card><p className="text-ink-soft text-sm">Nenhum pedido encontrado para esse filtro.</p></Card>
      )}

      <div className="grid gap-4">
        {pedidos.map((pedido) => (
          <Card key={pedido.id}>
            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
              <div>
                <p className="font-mono text-ink">#{pedido.id.slice(0, 8)}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPagamentoBadge status={pedido.statusPagamento} />
                <StatusPedidoBadge status={pedido.status} />
              </div>
            </div>

            <div className="text-sm text-ink-soft mb-3">
              <p>{pedido.cliente.nome} · {pedido.cliente.telefone}</p>
              <p>{pedido.cliente.endereco}</p>
              <p>Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}</p>
              {pedido.observacoes && <p>Obs: {pedido.observacoes}</p>}
            </div>

            <div className="flex flex-col gap-2 mb-3">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-ink">
                    {item.quantidade}x {item.itemCardapio.sabor}
                  </span>
                  <button onClick={() => alternarStatusUnidade(pedido.id, item)}>
                    <StatusUnidadeBadge status={item.statusUnidade} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-3 flex flex-wrap justify-between items-center gap-3">
              <span className="font-mono text-herb-dark font-medium">
                R$ {Number(pedido.valorTotal).toFixed(2)}
              </span>
              <select
                value={pedido.status}
                onChange={(e) => atualizarStatus(pedido.id, e.target.value as StatusPedido)}
                className="px-3 py-1.5 rounded-md border border-line bg-cream-card text-ink text-sm
                  focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
              >
                {STATUS_OPCOES.map((status) => (
                  <option key={status} value={status}>
                    {LABELS_PEDIDO[status]}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
