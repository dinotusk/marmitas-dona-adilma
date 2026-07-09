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
      <h1 className="font-display text-3xl text-ink mb-1">Finalizar pedido</h1>
      <p className="text-ink-soft mb-6">Confira os itens e conte pra gente onde entregar.</p>

      <Card className="mb-4">
        <h2 className="font-display text-lg text-ink mb-3">Seu pedido</h2>
        <div className="flex flex-col gap-2">
          {itens.map((i) => (
            <div key={i.itemCardapio.id} className="flex justify-between text-sm">
              <span className="text-ink">
                {i.quantidade}x {i.itemCardapio.sabor}
              </span>
              <span className="font-mono text-ink-soft">
                R$ {(Number(i.itemCardapio.preco) * i.quantidade).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-line mt-3 pt-3 flex justify-between items-center">
          <span className="font-medium text-ink">Total</span>
          <span className="font-mono text-herb-dark font-medium">R$ {valorTotal.toFixed(2)}</span>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="nome"
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <Input
            id="telefone"
            label="Telefone (com WhatsApp)"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            minLength={8}
            required
          />
          <Input
            id="endereco"
            label="Endereço de entrega"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Forma de pagamento</label>
            <div className="flex gap-2">
              {OPCOES_PAGAMENTO.map((op) => (
                <button
                  type="button"
                  key={op.valor}
                  onClick={() => setFormaPagamento(op.valor)}
                  className={`flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                    formaPagamento === op.valor
                      ? 'border-herb bg-herb/10 text-herb-dark'
                      : 'border-line text-ink-soft hover:bg-parchment-dark'
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
              rows={3}
              className="px-3.5 py-2.5 rounded-md border border-line bg-cream-card text-ink
                focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb resize-none"
              placeholder="Ex: sem cebola, tocar o interfone..."
            />
          </div>

          {erro && <p className="text-sm text-paprika-dark">{erro}</p>}

          <Button type="submit" disabled={enviando} className="mt-2">
            {enviando ? 'Enviando...' : `Confirmar pedido · R$ ${valorTotal.toFixed(2)}`}
          </Button>
        </form>
      </Card>
    </ClienteLayout>
  );
}
