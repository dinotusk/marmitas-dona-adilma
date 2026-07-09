import { useCallback, useEffect, useMemo, useState } from 'react';
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

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PaginaPedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [filtro, setFiltro] = useState<StatusPedido | 'TODOS'>('TODOS');
  const [buscaInput, setBuscaInput] = useState('');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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
        setTotalPedidos(resposta.total);
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

  const resumo = useMemo(() => {
    const marmitas = pedidos.reduce((total, pedido) => total + pedido.itens.reduce((sub, item) => sub + item.quantidade, 0), 0);
    const receita = pedidos.reduce((total, pedido) => total + Number(pedido.valorTotal), 0);
    const pendentes = pedidos.filter((pedido) => pedido.status !== 'ENTREGUE').length;
    return { marmitas, receita, pendentes };
  }, [pedidos]);

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="badge-pill rounded-full bg-paprika px-3 py-1 text-[10px] text-cream-card">Hoje</span>
          <h1 className="mt-3 font-display text-4xl text-ink">Bom dia, chef</h1>
          <p className="mt-1 text-sm text-ink-soft">Pedidos, produção e pagamentos em uma visão única.</p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Pedidos', String(totalPedidos), 'Total no filtro atual', 'bg-herb-light'],
          ['Em produção', String(resumo.pendentes), 'Ainda não entregues', 'bg-vanilla'],
          ['Marmitas', String(resumo.marmitas), 'Itens nesta página', 'bg-rose/60'],
          ['Receita', formatarMoeda(resumo.receita), 'Pedidos carregados', 'bg-cocoa text-vanilla'],
        ].map(([titulo, valor, detalhe, classe]) => (
          <Card key={titulo} className={`${classe} min-h-28`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{titulo}</p>
            <p className="mt-2 font-display text-3xl">{valor}</p>
            <p className="mt-1 text-xs opacity-70">{detalhe}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <input
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            placeholder="Buscar por nome ou telefone do cliente..."
            className="w-full rounded-lg border border-line bg-cream-card px-3.5 py-2.5 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setFiltro('TODOS')}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${
                filtro === 'TODOS' ? 'border-herb bg-herb text-cream-card' : 'border-line text-ink-soft hover:bg-vanilla'
              }`}
            >
              Todos
            </button>
            {STATUS_OPCOES.map((status) => (
              <button
                key={status}
                onClick={() => setFiltro(status)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  filtro === status ? 'border-herb bg-herb text-cream-card' : 'border-line text-ink-soft hover:bg-vanilla'
                }`}
              >
                {LABELS_PEDIDO[status]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && (
        <Card className="mb-4 border-paprika/40">
          <p className="text-sm text-paprika-dark">{erro}</p>
        </Card>
      )}

      {!carregando && pedidos.length === 0 && (
        <Card>
          <p className="text-sm text-ink-soft">Nenhum pedido encontrado para esse filtro.</p>
        </Card>
      )}

      <div className="grid gap-4">
        {pedidos.map((pedido) => (
          <Card key={pedido.id} className="overflow-hidden">
            <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="font-mono text-sm text-ink">#{pedido.id.slice(0, 8)}</p>
                <h2 className="mt-1 font-display text-2xl text-ink">{pedido.cliente.nome}</h2>
                <p className="mt-1 text-xs text-ink-soft">{new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <StatusPagamentoBadge status={pedido.statusPagamento} />
                <StatusPedidoBadge status={pedido.status} />
              </div>
            </div>

            <div className="grid gap-4 py-4 lg:grid-cols-[1fr_260px]">
              <div>
                <div className="mb-4 space-y-1 text-sm text-ink-soft">
                  <p>{pedido.cliente.telefone}</p>
                  <p>{pedido.cliente.endereco}</p>
                  <p>Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}</p>
                  {pedido.observacoes && <p>Obs: {pedido.observacoes}</p>}
                </div>

                <div className="grid gap-2">
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-parchment p-3 text-sm">
                      <span className="font-semibold text-ink">
                        {item.quantidade}x {item.itemCardapio.sabor}
                      </span>
                      <button type="button" onClick={() => alternarStatusUnidade(pedido.id, item)}>
                        <StatusUnidadeBadge status={item.statusUnidade} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-vanilla p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Total</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-herb-dark">{formatarMoeda(pedido.valorTotal)}</p>

                <div className="mt-4 grid gap-2">
                  <select
                    value={pedido.statusPagamento}
                    onChange={(e) => atualizarStatusPagamento(pedido.id, e.target.value as StatusPagamento)}
                    className="rounded-lg border border-line bg-cream-card px-3 py-2 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
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
                    className="rounded-lg border border-line bg-cream-card px-3 py-2 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
                  >
                    {STATUS_OPCOES.map((status) => (
                      <option key={status} value={status}>
                        {LABELS_PEDIDO[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!carregando && totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:bg-vanilla disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-ink-soft">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:bg-vanilla disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
