import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  StatusPedidoBadge,
  StatusUnidadeBadge,
  StatusPagamentoBadge,
  LABELS_PEDIDO,
  LABELS_PAGAMENTO,
} from '@/components/ui/StatusBadge';
import { api, ApiError } from '@/lib/api';
import type { Pedido, ItemPedido, StatusPedido, StatusPagamento } from '@/types/domain';

const STATUS_OPCOES: StatusPedido[] = ['RECEBIDO', 'EM_PREPARACAO', 'PRONTO', 'SAIU_ENTREGA', 'ENTREGUE'];
const STATUS_PAGAMENTO_OPCOES: StatusPagamento[] = ['PENDENTE', 'PAGO', 'CANCELADO'];

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

interface RespostaPedidos {
  pedidos: Pedido[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export function PaginaPedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<StatusPedido | 'TODOS'>('TODOS');
  const [buscaInput, setBuscaInput] = useState('');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Debounce da busca por nome/telefone
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusca(buscaInput.trim());
      setPagina(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [buscaInput]);

  useEffect(() => {
    setPagina(1);
  }, [filtro]);

  const carregarPedidos = useCallback(() => {
    const params = new URLSearchParams();
    if (filtro !== 'TODOS') params.set('status', filtro);
    if (busca) params.set('busca', busca);
    params.set('pagina', String(pagina));
    api
      .get<RespostaPedidos>(`/pedidos?${params.toString()}`, true)
      .then((resposta) => {
        setPedidos(resposta.pedidos);
        setTotalPaginas(resposta.totalPaginas);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os pedidos'))
      .finally(() => setCarregando(false));
  }, [filtro, busca, pagina]);

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

  async function atualizarStatusPagamento(pedidoId: string, statusPagamento: StatusPagamento) {
    try {
      const atualizado = await api.patch<Pedido>(`/pedidos/${pedidoId}/pagamento`, { statusPagamento }, true);
      setPedidos((atual) => atual.map((p) => (p.id === pedidoId ? atualizado : p)));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível atualizar o status de pagamento');
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

      <input
        value={buscaInput}
        onChange={(e) => setBuscaInput(e.target.value)}
        placeholder="Buscar por nome ou telefone do cliente..."
        className="w-full mb-4 px-3.5 py-2.5 rounded-xl border border-line bg-cream-card text-ink text-sm
          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
      />

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
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pedido.statusPagamento}
                  onChange={(e) => atualizarStatusPagamento(pedido.id, e.target.value as StatusPagamento)}
                  className="px-3 py-1.5 rounded-md border border-line bg-cream-card text-ink text-sm
                    focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
                >
                  {STATUS_PAGAMENTO_OPCOES.map((status) => (
                    <option key={status} value={status}>
                      {LABELS_PAGAMENTO[status]}
                    </option>
                  ))}
                </select>
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
            </div>
          </Card>
        ))}
      </div>

      {!carregando && totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-3 py-1.5 rounded-md border border-line text-sm text-ink-soft hover:bg-parchment-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-ink-soft">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="px-3 py-1.5 rounded-md border border-line text-sm text-ink-soft hover:bg-parchment-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
