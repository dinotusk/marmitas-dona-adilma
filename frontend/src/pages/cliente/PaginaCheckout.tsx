import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import type { FormaPagamento, Pedido, TipoDesconto, TipoEntrega } from '@/types/domain';

interface CupomValidado {
  codigo: string;
  tipo: TipoDesconto;
  valor: number;
  valorDesconto: number;
}

const OPCOES_PAGAMENTO: { valor: FormaPagamento; label: string }[] = [
  { valor: 'PIX', label: 'Pix' },
  { valor: 'CARTAO', label: 'Cartão' },
  { valor: 'DINHEIRO', label: 'Dinheiro' },
];

const OPCOES_ENTREGA: { valor: TipoEntrega; label: string }[] = [
  { valor: 'ENTREGA', label: 'Entrega' },
  { valor: 'RETIRADA', label: 'Retirada' },
];

const TAXA_ENTREGA = 8;

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
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('ENTREGA');
  const [observacoes, setObservacoes] = useState('');
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<CupomValidado | null>(null);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pedidoEnviado = useRef(false);

  const taxaEntrega = tipoEntrega === 'ENTREGA' ? TAXA_ENTREGA : 0;
  const valorDesconto = cupomAplicado?.valorDesconto ?? 0;
  const totalComExtras = Math.max(0, valorTotal - valorDesconto) + taxaEntrega;

  async function aplicarCupom() {
    if (!cupomCodigo.trim()) return;
    setValidandoCupom(true);
    setErroCupom(null);
    try {
      const cupom = await api.get<CupomValidado>(
        `/cupons/validar/${encodeURIComponent(cupomCodigo.trim())}?subtotal=${valorTotal}`
      );
      setCupomAplicado(cupom);
    } catch (err) {
      setCupomAplicado(null);
      setErroCupom(err instanceof ApiError ? err.message : 'Cupom inválido');
    } finally {
      setValidandoCupom(false);
    }
  }

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
        tipoEntrega,
        cupomCodigo: cupomAplicado ? cupomAplicado.codigo : undefined,
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
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
        <section className="rounded-xl border border-line bg-cream-card p-5 shadow-[0_1px_0_rgba(36,27,15,0.04)]">
          <div className="mb-5">
            <h1 className="font-display text-3xl leading-none text-ink">Finalizar pedido</h1>
            <p className="mt-2 text-sm text-ink-soft">Confirme seus dados antes de enviar.</p>
          </div>

          <div className="grid gap-3">
            <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input id="telefone" label="Telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} minLength={8} required />
            <Input id="endereco" label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} required />
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-ink-soft">Entrega</h2>
            <div className="grid grid-cols-2 gap-2">
              {OPCOES_ENTREGA.map((op) => (
                <button
                  type="button"
                  key={op.valor}
                  onClick={() => setTipoEntrega(op.valor)}
                  className={`h-14 rounded-lg border text-center text-base font-medium transition-colors ${
                    tipoEntrega === op.valor
                      ? 'border-herb bg-herb/10 text-herb-dark'
                      : 'border-line bg-cream-card text-ink-soft'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-ink-soft">Forma de pagamento</h2>
            <div className="grid grid-cols-3 gap-2">
              {OPCOES_PAGAMENTO.map((op) => (
                <button
                  type="button"
                  key={op.valor}
                  onClick={() => setFormaPagamento(op.valor)}
                  className={`h-14 rounded-lg border text-center text-base font-medium transition-colors ${
                    formaPagamento === op.valor
                      ? 'border-herb bg-herb/10 text-herb-dark'
                      : 'border-line bg-cream-card text-ink-soft'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-ink-soft">Cupom de desconto</h2>
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-straw bg-straw/15 p-3">
              <span className="pl-1 text-sm">🎟️</span>
              <input
                value={cupomCodigo}
                onChange={(e) => {
                  setCupomCodigo(e.target.value);
                  setCupomAplicado(null);
                  setErroCupom(null);
                }}
                placeholder="Código do cupom"
                className="h-9 flex-1 rounded-lg border-none bg-transparent px-1 text-sm text-ink placeholder:text-ink-soft/55 focus:outline-none"
              />
              <button
                type="button"
                onClick={aplicarCupom}
                disabled={validandoCupom || !cupomCodigo.trim()}
                className="shrink-0 text-xs font-bold text-herb-dark hover:underline disabled:opacity-40"
              >
                {validandoCupom ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
            {cupomAplicado && (
              <p className="mt-2 text-sm text-herb-dark">
                Cupom "{cupomAplicado.codigo}" aplicado — desconto de {formatarMoeda(valorDesconto)}
              </p>
            )}
            {erroCupom && <p className="mt-2 text-sm text-paprika-dark">{erroCupom}</p>}
          </div>

          <div className="mt-6">
            <label htmlFor="observacoes" className="mb-3 block text-sm font-bold text-ink-soft">
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={5}
              className="min-h-36 w-full resize-none rounded-lg border border-line bg-cream-card px-4 py-3 text-base text-ink placeholder:text-ink-soft/55 focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
              placeholder="Ex: sem cebola, tocar o interfone..."
            />
          </div>

          {erro && <p className="mt-4 rounded-lg bg-paprika/10 px-3 py-2 text-sm text-paprika-dark">{erro}</p>}

          <Button type="submit" disabled={enviando} className="mt-6 h-14 w-full rounded-lg text-base">
            {enviando ? 'Enviando...' : `Confirmar pedido - ${formatarMoeda(totalComExtras)}`}
          </Button>
        </section>

        <section className="rounded-xl border border-line bg-vanilla p-5 shadow-[0_1px_0_rgba(36,27,15,0.04)]">
          <h2 className="font-display text-4xl leading-none text-ink">Seu pedido</h2>

          <div className="mt-5 space-y-3">
            {itens.map((i) => (
              <div key={i.itemCardapio.id} className="flex items-center justify-between gap-4 rounded-lg bg-cream-card p-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-ink">{i.itemCardapio.sabor}</p>
                  <p className="mt-2 text-sm text-ink-soft">{i.quantidade} unidade(s)</p>
                </div>
                <span className="font-mono text-base text-ink-soft">{formatarMoeda(Number(i.itemCardapio.preco) * i.quantidade)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center justify-between text-base text-ink-soft">
              <span>Subtotal</span>
              <span className="font-mono">{formatarMoeda(valorTotal)}</span>
            </div>
            {valorDesconto > 0 && (
              <div className="mt-2 flex items-center justify-between text-base text-herb-dark">
                <span>Desconto</span>
                <span className="font-mono">-{formatarMoeda(valorDesconto)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-base text-ink-soft">
              <span>Taxa de entrega</span>
              <span className="font-mono">{taxaEntrega > 0 ? formatarMoeda(taxaEntrega) : 'Grátis'}</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-ink">Total</span>
              <span className="font-mono text-2xl font-bold text-herb-dark">{formatarMoeda(totalComExtras)}</span>
            </div>
          </div>
        </section>
      </form>
    </ClienteLayout>
  );
}
