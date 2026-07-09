import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPedidoBadge, StatusUnidadeBadge } from '@/components/ui/StatusBadge';
import { api, ApiError } from '@/lib/api';
import type { Pedido, StatusPedido } from '@/types/domain';

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

const ETAPAS: { status: StatusPedido; label: string }[] = [
  { status: 'RECEBIDO', label: 'Recebido' },
  { status: 'EM_PREPARACAO', label: 'Em preparo' },
  { status: 'PRONTO', label: 'Pronto' },
  { status: 'SAIU_ENTREGA', label: 'Entrega' },
  { status: 'ENTREGUE', label: 'Entregue' },
];

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

  const etapaAtual = pedido ? ETAPAS.findIndex((etapa) => etapa.status === pedido.status) : -1;

  return (
    <ClienteLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-xl bg-herb px-5 py-8 text-center text-cream-card sm:px-8">
          <span className="badge-pill rounded-full bg-cream-card/15 px-3 py-1 text-[10px]">Pedido confirmado</span>
          <h1 className="mt-4 font-display text-4xl">Aí! Sua marmita já entrou na fila</h1>
          {pedido && <p className="mt-2 font-mono text-sm text-cream-card/75">Pedido #{pedido.id.slice(0, 8)}</p>}
        </div>

        {carregando && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {erro && !carregando && (
          <Card className="border-paprika/40">
            <p className="text-sm text-paprika-dark">{erro}</p>
          </Card>
        )}

        {pedido && !carregando && (
          <div className="grid gap-4">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-soft">Status atual</p>
                  <div className="mt-1">
                    <StatusPedidoBadge status={pedido.status} />
                  </div>
                </div>
                <p className="font-mono text-xl font-semibold text-herb-dark">{formatarMoeda(pedido.valorTotal)}</p>
              </div>

              <div className="mt-6 space-y-0">
                {ETAPAS.map((etapa, index) => {
                  const concluida = index <= etapaAtual;
                  return (
                    <div key={etapa.status} className="grid grid-cols-[24px_1fr] gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`h-4 w-4 rounded-full border-2 ${concluida ? 'border-herb bg-herb' : 'border-line bg-cream-card'}`} />
                        {index < ETAPAS.length - 1 && <span className={`h-8 w-px ${index < etapaAtual ? 'bg-herb' : 'bg-line'}`} />}
                      </div>
                      <p className={`pb-4 text-sm font-semibold ${concluida ? 'text-ink' : 'text-ink-soft'}`}>{etapa.label}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-2xl text-ink">Itens</h2>
              <div className="mt-4 space-y-3">
                {pedido.itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-parchment p-3 text-sm">
                    <span className="font-semibold text-ink">
                      {item.quantidade}x {item.itemCardapio.sabor}
                    </span>
                    <StatusUnidadeBadge status={item.statusUnidade} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-2xl text-ink">Entrega</h2>
              <div className="mt-3 space-y-1 text-sm text-ink-soft">
                <p>{pedido.cliente.nome} - {pedido.cliente.telefone}</p>
                <p>{pedido.cliente.endereco}</p>
                <p>Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}</p>
                {pedido.observacoes && <p>Obs: {pedido.observacoes}</p>}
              </div>
            </Card>

            <Button variant="ghost" className="justify-self-center" onClick={() => window.location.assign('/')}>
              Fazer outro pedido
            </Button>
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}
