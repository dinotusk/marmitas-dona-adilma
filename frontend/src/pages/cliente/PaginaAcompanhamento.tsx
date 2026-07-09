import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { Pedido, StatusPedido } from '@/types/domain';

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

const ETAPAS: { status: StatusPedido; label: string; detalhe: string }[] = [
  { status: 'RECEBIDO', label: 'Recebido', detalhe: 'Agora mesmo' },
  { status: 'EM_PREPARACAO', label: 'Em produção', detalhe: 'Separando seu pedido' },
  { status: 'PRONTO', label: 'Pronto', detalhe: 'Aguardando entrega' },
  { status: 'SAIU_ENTREGA', label: 'Entrega', detalhe: 'Saiu para entrega' },
  { status: 'ENTREGUE', label: 'Entregue', detalhe: 'Pedido finalizado' },
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
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-line bg-vanilla shadow-sm">
        <header className="relative overflow-hidden bg-herb px-6 pb-10 pt-8 text-center text-cream-card">
          <span className="absolute left-6 top-10 h-3 w-3 rounded-full bg-straw" />
          <span className="absolute right-10 top-16 h-2 w-2 rounded-full bg-rose" />
          <span className="absolute bottom-8 right-16 h-4 w-4 rotate-45 bg-herb-light" />
          <span className="badge-pill inline-flex rotate-[-4deg] rounded-sm bg-straw px-4 py-2 text-[10px] text-cocoa">
            Pedido confirmado!
          </span>
          <h1 className="mx-auto mt-6 max-w-xs font-display text-3xl leading-tight">
            Aê! Sua marmita já entrou na fila
          </h1>
          {pedido && <p className="mt-2 font-mono text-xs text-cream-card/80">Pedido #{pedido.id.slice(0, 8)}</p>}
        </header>

        {carregando && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {erro && !carregando && <p className="m-4 rounded-lg bg-paprika/10 px-3 py-2 text-sm text-paprika-dark">{erro}</p>}

        {pedido && !carregando && (
          <div className="space-y-5 px-5 py-5">
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Chega em</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">Atualiza automaticamente</p>
                </div>
                <span className="font-display text-xl text-ink">35-45 min</span>
              </div>

              <div>
                {ETAPAS.map((etapa, index) => {
                  const concluida = index <= etapaAtual;
                  return (
                    <div key={etapa.status} className="grid grid-cols-[18px_1fr] gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <span className={`h-3 w-3 rounded-full ${concluida ? 'bg-herb' : 'bg-line'}`} />
                        {index < ETAPAS.length - 1 && <span className={`h-9 w-px ${index < etapaAtual ? 'bg-herb' : 'bg-line'}`} />}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-bold ${concluida ? 'text-ink' : 'text-ink-soft'}`}>{etapa.label}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">{etapa.detalhe}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg bg-cream-card p-4">
              <h2 className="font-display text-xl text-ink">Resumo</h2>
              <div className="mt-3 space-y-2">
                {pedido.itens.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">
                      {item.quantidade}x {item.itemCardapio.sabor}
                    </span>
                    <span className="font-mono text-ink-soft">{formatarMoeda(Number(item.itemCardapio.preco) * item.quantidade)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-line pt-3">
                <span className="font-bold text-ink">Total</span>
                <span className="font-mono font-bold text-herb-dark">{formatarMoeda(pedido.valorTotal)}</span>
              </div>
            </section>

            <section className="rounded-lg bg-cream-card p-4 text-sm text-ink-soft">
              <p className="font-bold text-ink">{pedido.cliente.nome}</p>
              <p className="mt-1">{pedido.cliente.telefone}</p>
              <p className="mt-1">{pedido.cliente.endereco}</p>
              <p className="mt-1">Pagamento: {FORMA_PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}</p>
              {pedido.observacoes && <p className="mt-1">Obs: {pedido.observacoes}</p>}
            </section>

            <Button variant="secondary" className="w-full" onClick={() => window.location.assign('/')}>
              Acompanhar pedido
            </Button>
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}
