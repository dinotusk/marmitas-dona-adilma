import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import type { FormaPagamento, Pedido } from '@/types/domain';

const OPCOES_PAGAMENTO: { valor: FormaPagamento; label: string }[] = [
  { valor: 'PIX', label: 'Pix' },
  { valor: 'CARTAO', label: 'Cartão de crédito' },
  { valor: 'DINHEIRO', label: 'Dinheiro' },
];

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PaginaCheckout() {
  const { itens, valorTotal, limpar } = useCarrinho();
  const { cliente } = useClienteAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState(cliente?.nome ?? '');
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '');
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pedidoEnviado = useRef(false);

  if (itens.length === 0 && !pedidoEnviado.current) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const pedido = await api.post<Pedido>('/pedidos', {
        nome,
        telefone,
        endereco,
        formaPagamento,
        observacoes: observacoes.trim() || undefined,
        itens: itens.map((i) => ({ itemCardapioId: i.itemCardapio.id, quantidade: i.quantidade })),
      });
      pedidoEnviado.current = true;
      navigate(`/pedido/${pedido.id}`);
      limpar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar seu pedido');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ClienteLayout>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md overflow-hidden rounded-2xl border border-line bg-vanilla shadow-sm">
        <header className="bg-herb px-5 pb-5 pt-6 text-cream-card">
          <button type="button" onClick={() => navigate('/')} className="mb-4 text-xl leading-none" aria-label="Voltar">
            ←
          </button>
          <h1 className="font-display text-2xl">Finalizar pedido</h1>
        </header>

        <div className="space-y-5 px-4 py-5">
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Seu pedido</h2>
            <div className="space-y-2">
              {itens.map((i) => (
                <div key={i.itemCardapio.id} className="grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded-lg bg-cream-card p-2.5">
                  <div className="food-pattern h-12 rounded-md border border-line" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{i.itemCardapio.sabor}</p>
                    <p className="mt-1 font-mono text-xs text-ink-soft">{formatarMoeda(i.itemCardapio.preco)}</p>
                  </div>
                  <span className="rounded-md bg-parchment px-2 py-1 font-mono text-xs text-ink-soft">{i.quantidade}x</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Entrega</h2>
            <div className="rounded-lg bg-cream-card p-3">
              <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <div className="mt-3">
                <Input id="telefone" label="Telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} minLength={8} required />
              </div>
              <div className="mt-3">
                <Input id="endereco" label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} required />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Pagamento</h2>
            <div className="space-y-2">
              {OPCOES_PAGAMENTO.map((op) => (
                <button
                  type="button"
                  key={op.valor}
                  onClick={() => setFormaPagamento(op.valor)}
                  className={`flex w-full items-center justify-between rounded-lg border bg-cream-card px-3 py-3 text-left text-sm font-semibold ${
                    formaPagamento === op.valor ? 'border-herb text-ink ring-1 ring-herb/30' : 'border-line text-ink-soft'
                  }`}
                >
                  <span>{op.label}</span>
                  <span className={`h-3 w-3 rounded-full border ${formaPagamento === op.valor ? 'border-herb bg-herb' : 'border-line'}`} />
                </button>
              ))}
            </div>
          </section>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-line bg-cream-card px-3.5 py-2.5 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
            placeholder="Observações (opcional)"
          />

          <section className="rounded-lg bg-cream-card p-4">
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>Subtotal</span>
              <span className="font-mono">{formatarMoeda(valorTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <span className="font-bold text-ink">Total</span>
              <span className="font-mono text-lg font-bold text-ink">{formatarMoeda(valorTotal)}</span>
            </div>
          </section>

          {erro && <p className="rounded-lg bg-paprika/10 px-3 py-2 text-sm text-paprika-dark">{erro}</p>}

          <Button type="submit" variant="secondary" disabled={enviando} className="w-full">
            {enviando ? 'Enviando...' : `Confirmar pedido - ${formatarMoeda(valorTotal)}`}
          </Button>
        </div>
      </form>
    </ClienteLayout>
  );
}
