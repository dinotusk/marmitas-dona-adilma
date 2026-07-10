import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import type { Assinatura, Cardapio, FormaPagamento, Periodicidade, TipoEntrega } from '@/types/domain';

const PERIODICIDADE_LABEL: Record<Periodicidade, string> = {
  SEMANAL: 'Toda semana',
  QUINZENAL: 'A cada 15 dias',
  MENSAL: 'Todo mês',
};

const STATUS_LABEL: Record<string, string> = {
  ATIVA: 'Ativa',
  PAUSADA: 'Pausada',
  CANCELADA: 'Cancelada',
};

const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function PaginaPlanos() {
  const { cliente } = useClienteAuth();
  const [cardapio, setCardapio] = useState<Cardapio | null>(null);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('SEMANAL');
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('ENTREGA');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  function carregarAssinaturas() {
    api
      .get<Assinatura[]>('/assinaturas/minhas', false, true)
      .then(setAssinaturas)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar seus planos'));
  }

  useEffect(() => {
    if (!cliente) return;
    Promise.all([api.get<Cardapio>('/cardapio'), api.get<Assinatura[]>('/assinaturas/minhas', false, true)])
      .then(([c, a]) => {
        setCardapio(c);
        setAssinaturas(a);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os planos'))
      .finally(() => setCarregando(false));
  }, [cliente]);

  if (!cliente) {
    return <Navigate to="/login" replace />;
  }

  function alterarQuantidade(itemId: string, quantidade: number) {
    setQuantidades((atual) => {
      if (quantidade <= 0) {
        const { [itemId]: _remover, ...resto } = atual;
        return resto;
      }
      return { ...atual, [itemId]: quantidade };
    });
  }

  const itensSelecionados = Object.entries(quantidades).filter(([, qtd]) => qtd > 0);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setErroCriacao(null);
    if (itensSelecionados.length === 0) {
      setErroCriacao('Escolha ao menos um prato para o seu plano');
      return;
    }
    setCriando(true);
    try {
      await api.post(
        '/assinaturas',
        {
          periodicidade,
          tipoEntrega,
          formaPagamento,
          itens: itensSelecionados.map(([itemCardapioId, quantidade]) => ({ itemCardapioId, quantidade })),
        },
        false,
        true
      );
      setQuantidades({});
      carregarAssinaturas();
    } catch (e) {
      setErroCriacao(e instanceof ApiError ? e.message : 'Não foi possível criar o plano');
    } finally {
      setCriando(false);
    }
  }

  async function alterarStatus(id: string, status: 'ATIVA' | 'PAUSADA' | 'CANCELADA') {
    try {
      const atualizada = await api.patch<Assinatura>(`/assinaturas/${id}`, { status }, false, true);
      setAssinaturas((atual) => atual.map((a) => (a.id === atualizada.id ? atualizada : a)));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível atualizar o plano');
    }
  }

  return (
    <ClienteLayout>
      <div className="mb-6">
        <span className="badge-pill inline-flex rotate-[-3deg] rounded-sm bg-paprika px-3 py-1 text-[10px] text-cream-card">
          Planos recorrentes
        </span>
        <h1 className="mt-3 font-display text-3xl text-ink">Suas marmitas, no automático</h1>
        <p className="mt-1 text-ink-soft">Escolha os pratos e a frequência — a gente gera o pedido pra você.</p>
      </div>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && !carregando && (
        <Card className="border-paprika/40 mb-4">
          <p className="text-sm text-paprika-dark">{erro}</p>
        </Card>
      )}

      {!carregando && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-ink">Seus planos</h2>
            {assinaturas.length === 0 && (
              <Card>
                <p className="text-sm text-ink-soft">Você ainda não tem nenhum plano ativo.</p>
              </Card>
            )}
            {assinaturas.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-ink">{PERIODICIDADE_LABEL[a.periodicidade]}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {a.itensPadrao.reduce((soma, i) => soma + i.quantidade, 0)} marmita(s) por ciclo · {FORMA_PAGAMENTO_LABEL[a.formaPagamento]}
                    </p>
                    {a.status === 'ATIVA' && (
                      <p className="mt-1 text-xs text-herb-dark">Próximo pedido em {formatarData(a.proximoPedidoEm)}</p>
                    )}
                  </div>
                  <span
                    className={`stamp-badge stamp-badge--tilt-a px-2.5 py-1 text-[10px] ${
                      a.status === 'ATIVA' ? 'bg-herb text-cream-card' : a.status === 'PAUSADA' ? 'bg-straw text-cocoa' : 'bg-ink-soft text-cream-card'
                    }`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  {a.status === 'ATIVA' && (
                    <button
                      type="button"
                      onClick={() => alterarStatus(a.id, 'PAUSADA')}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-vanilla"
                    >
                      Pausar
                    </button>
                  )}
                  {a.status === 'PAUSADA' && (
                    <button
                      type="button"
                      onClick={() => alterarStatus(a.id, 'ATIVA')}
                      className="rounded-lg bg-herb px-3 py-1.5 text-xs font-bold text-cream-card hover:bg-herb-dark"
                    >
                      Retomar
                    </button>
                  )}
                  {a.status !== 'CANCELADA' && (
                    <button
                      type="button"
                      onClick={() => alterarStatus(a.id, 'CANCELADA')}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-paprika-dark hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div>
            <h2 className="mb-3 font-display text-2xl text-ink">Criar novo plano</h2>
            <Card>
              <form onSubmit={handleCriar} className="grid gap-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Frequência</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PERIODICIDADE_LABEL) as Periodicidade[]).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPeriodicidade(p)}
                        className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                          periodicidade === p ? 'border-herb bg-herb/10 text-herb-dark' : 'border-line text-ink-soft'
                        }`}
                      >
                        {PERIODICIDADE_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Entrega</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoEntrega('ENTREGA')}
                      className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                        tipoEntrega === 'ENTREGA' ? 'border-herb bg-herb/10 text-herb-dark' : 'border-line text-ink-soft'
                      }`}
                    >
                      Entrega
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoEntrega('RETIRADA')}
                      className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                        tipoEntrega === 'RETIRADA' ? 'border-herb bg-herb/10 text-herb-dark' : 'border-line text-ink-soft'
                      }`}
                    >
                      Retirada
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(FORMA_PAGAMENTO_LABEL) as FormaPagamento[]).map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setFormaPagamento(f)}
                        className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                          formaPagamento === f ? 'border-herb bg-herb/10 text-herb-dark' : 'border-line text-ink-soft'
                        }`}
                      >
                        {FORMA_PAGAMENTO_LABEL[f]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Pratos do plano</p>
                  <div className="grid gap-2">
                    {cardapio?.itens.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-parchment px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{item.sabor}</p>
                          <p className="text-xs text-ink-soft">{formatarMoeda(item.preco)}</p>
                        </div>
                        <div className="grid h-9 w-28 grid-cols-[1fr_32px_1fr] items-center overflow-hidden rounded-lg border border-line bg-cream-card shrink-0">
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.id, (quantidades[item.id] ?? 0) - 1)}
                            className="h-9 text-base font-semibold hover:bg-vanilla"
                          >
                            −
                          </button>
                          <span className="text-center font-mono text-sm">{quantidades[item.id] ?? 0}</span>
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.id, (quantidades[item.id] ?? 0) + 1)}
                            className="h-9 text-base font-semibold hover:bg-vanilla"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {!cardapio?.itens.length && <p className="text-sm text-ink-soft">Nenhum prato disponível no momento.</p>}
                  </div>
                </div>

                {erroCriacao && <p className="text-sm text-paprika-dark">{erroCriacao}</p>}

                <Button type="submit" disabled={criando} className="justify-self-start">
                  {criando ? 'Criando...' : 'Criar plano'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </ClienteLayout>
  );
}
