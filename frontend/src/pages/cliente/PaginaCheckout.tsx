import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import type { FormaPagamento, Pedido } from '@/types/domain';

const OPCOES_PAGAMENTO: { valor: FormaPagamento; label: string }[] = [
  { valor: 'PIX', label: 'Pix' },
  { valor: 'CARTAO', label: 'Cartão' },
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
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <section>
          <div className="mb-5">
            <span className="badge-pill rounded-full bg-herb/10 px-3 py-1 text-[10px] text-herb-dark">Checkout</span>
            <h1 className="mt-3 font-display text-4xl text-ink">Finalizar pedido</h1>
            <p className="mt-2 text-sm text-ink-soft">Revise sua seleção e informe os dados de entrega.</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input
                id="telefone"
                label="Telefone (com WhatsApp)"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                minLength={8}
                required
              />
              <Input id="endereco" label="Endereço de entrega" value={endereco} onChange={(e) => setEndereco(e.target.value)} required />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-soft">Forma de pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {OPCOES_PAGAMENTO.map((op) => (
                    <button
                      type="button"
                      key={op.valor}
                      onClick={() => setFormaPagamento(op.valor)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        formaPagamento === op.valor
                          ? 'border-herb bg-herb/10 text-herb-dark'
                          : 'border-line bg-cream-card text-ink-soft hover:bg-vanilla'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="observacoes" className="text-sm font-medium text-ink-soft">
                  Observações (opcional)
                </label>
                <textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                  className="resize-none rounded-lg border border-line bg-cream-card px-3.5 py-2.5 text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
                  placeholder="Ex: sem cebola, tocar o interfone..."
                />
              </div>

              {erro && <p className="rounded-lg bg-paprika/10 px-3 py-2 text-sm text-paprika-dark">{erro}</p>}

              <Button type="submit" disabled={enviando} className="mt-2 w-full sm:w-auto">
                {enviando ? 'Enviando...' : `Confirmar pedido - ${formatarMoeda(valorTotal)}`}
              </Button>
            </form>
          </Card>
        </section>

        <aside className="lg:sticky lg:top-24">
          <Card className="bg-vanilla">
            <h2 className="font-display text-2xl text-ink">Seu pedido</h2>
            <div className="mt-4 space-y-3">
              {itens.map((i) => (
                <div key={i.itemCardapio.id} className="flex items-start justify-between gap-3 rounded-lg bg-cream-card p-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{i.itemCardapio.sabor}</p>
                    <p className="mt-1 text-xs text-ink-soft">{i.quantidade} unidade(s)</p>
                  </div>
                  <span className="font-mono text-ink-soft">{formatarMoeda(Number(i.itemCardapio.preco) * i.quantidade)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <div className="flex items-center justify-between text-sm text-ink-soft">
                <span>Subtotal</span>
                <span className="font-mono">{formatarMoeda(valorTotal)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-mono text-xl font-semibold text-herb-dark">{formatarMoeda(valorTotal)}</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </ClienteLayout>
  );
}
