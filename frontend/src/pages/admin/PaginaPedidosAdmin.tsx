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
    const ticketMedio = pedidos.length ? receita / pedidos.length : 0;
    return { marmitas, receita, pendentes, ticketMedio };
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
    <div className="space-y-4">
      <section className="hidden rounded-xl bg-cocoa px-6 py-5 text-vanilla lg:block">
        <p className="text-xs text-vanilla/60">Marmitas dona Adilma</p>
        <h1 className="mt-1 font-display text-4xl">Bom dia, chef</h1>
        <p className="mt-1 text-sm text-vanilla/60">Pedidos, produção e pagamentos em uma visão única.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Pedidos', String(totalPedidos), 'Total no filtro atual', 'bg-herb-light text-herb-dark'],
          ['Em produção', String(resumo.pendentes), 'Ainda não entregues', 'bg-vanilla text-cocoa'],
          ['Marmitas', String(resumo.marmitas), 'Itens nesta página', 'bg-rose/70 text-paprika-dark'],
          ['Receita', formatarMoeda(resumo.receita), 'Pedidos carregados', 'bg-cream-card text-herb-dark'],
        ].map(([titulo, valor, detalhe, classe]) => (
          <div key={titulo} className={`flex h-28 flex-col justify-between rounded-xl border border-line p-4 ${classe}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-current/75">{titulo}</p>
            <p className="font-display text-3xl leading-none tracking-normal">{valor}</p>
            <p className="truncate text-xs text-current/65">{detalhe}</p>
          </div>
        ))}
      </section>

      <Card className="bg-vanilla p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <input
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="h-11 w-full rounded-lg border border-line bg-cream-card px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setFiltro('TODOS')}
              className={`flex h-10 shrink-0 items-center rounded-lg border px-4 text-sm font-bold ${
                filtro === 'TODOS' ? 'border-herb bg-herb text-cream-card' : 'border-line bg-cream-card text-ink-soft'
              }`}
            >
              Todos
            </button>
            {STATUS_OPCOES.map((status) => (
              <button
                key={status}
                onClick={() => setFiltro(status)}
                className={`flex h-10 shrink-0 items-center rounded-lg border px-4 text-sm font-bold ${
                  filtro === status ? 'border-herb bg-herb text-cream-card' : 'border-line bg-cream-card text-ink-soft'
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
        <Card className="border-paprika/40">
          <p className="text-sm text-paprika-dark">{erro}</p>
        </Card>
      )}

      {!carregando && pedidos.length === 0 && (
        <Card>
          <p className="text-sm text-ink-soft">Nenhum pedido encontrado para esse filtro.</p>
        </Card>
      )}

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink">Pedidos recentes</h2>
            <span className="text-xs font-bold text-herb-dark">{totalPedidos} no filtro</span>
          </div>

          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="p-0">
              <div className="grid gap-3 p-3 lg:grid-cols-[1fr_auto] lg:p-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl leading-tight text-ink">{pedido.cliente.nome}</h3>
                      <p className="mt-1 font-mono text-xs text-ink-soft">#{pedido.id.slice(0, 8)} · {new Date(pedido.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <StatusPagamentoBadge status={pedido.statusPagamento} />
                      <StatusPedidoBadge status={pedido.status} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm leading-5 text-ink-soft">
                    <p>{pedido.cliente.telefone}</p>
                    <p>{pedido.cliente.endereco}</p>
                    {pedido.observacoes && <p>Obs: {pedido.observacoes}</p>}
                  </div>

                  <div className="mt-3 grid gap-2">
                    {pedido.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-parchment px-3 py-2 text-sm">
                        <span className="font-semibold text-ink">{item.quantidade}x {item.itemCardapio.sabor}</span>
                        <button type="button" onClick={() => alternarStatusUnidade(pedido.id, item)}>
                          <StatusUnidadeBadge status={item.statusUnidade} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-vanilla p-3 lg:w-64 lg:p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Total</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-herb-dark">{formatarMoeda(pedido.valorTotal)}</p>
                  <p className="mt-1 text-xs text-ink-soft">Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}</p>

                  <div className="mt-4 grid gap-2">
                    <select
                      value={pedido.statusPagamento}
                      onChange={(e) => atualizarStatusPagamento(pedido.id, e.target.value as StatusPagamento)}
                      className="rounded-lg border border-line bg-cream-card px-3 py-2 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
                    >
                      {STATUS_PAGAMENTO_OPCOES.map((status) => (
                        <option key={status} value={status}>{LABELS_PAGAMENTO[status]}</option>
                      ))}
                    </select>
                    <select
                      value={pedido.status}
                      onChange={(e) => atualizarStatus(pedido.id, e.target.value as StatusPedido)}
                      className="rounded-lg border border-line bg-cream-card px-3 py-2 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
                    >
                      {STATUS_OPCOES.map((status) => (
                        <option key={status} value={status}>{LABELS_PEDIDO[status]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <aside className="rounded-xl bg-herb p-5 text-cream-card xl:sticky xl:top-8 xl:self-start">
          <p className="text-xs font-bold uppercase tracking-wide text-cream-card/70">Ticket médio</p>
          <p className="mt-2 font-display text-4xl">{formatarMoeda(resumo.ticketMedio)}</p>
          <p className="mt-4 text-sm text-cream-card/75">Resumo calculado com os pedidos carregados nesta página.</p>
        </aside>
      </section>

      {!carregando && totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:bg-vanilla disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-ink-soft">Página {pagina} de {totalPaginas}</span>
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
