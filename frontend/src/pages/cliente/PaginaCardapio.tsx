import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import type { Cardapio } from '@/types/domain';

export function PaginaCardapio() {
  const [cardapio, setCardapio] = useState<Cardapio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { itens, quantidadeTotal, valorTotal, definirQuantidade } = useCarrinho();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Cardapio>('/cardapio')
      .then(setCardapio)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o cardápio'))
      .finally(() => setCarregando(false));
  }, []);

  function quantidadeNoCarrinho(itemId: string) {
    return itens.find((i) => i.itemCardapio.id === itemId)?.quantidade ?? 0;
  }

  return (
    <ClienteLayout>
      <h1 className="font-display text-3xl text-ink mb-1">Cardápio da semana</h1>
      <p className="text-ink-soft mb-6">Escolha suas marmitas favoritas para essa semana.</p>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && !carregando && (
        <Card className="border-paprika/40">
          <p className="text-paprika-dark text-sm">{erro}</p>
        </Card>
      )}

      {cardapio && !carregando && (
        <div className="grid gap-3 pb-24">
          {cardapio.itens.map((item) => {
            const qtd = quantidadeNoCarrinho(item.id);
            const semEstoque = item.controlaEstoque && item.qtdDisponivel <= 0;
            const limiteQtd = item.controlaEstoque ? item.qtdDisponivel : 99;
            return (
              <Card key={item.id} className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg text-ink">{item.sabor}</h2>
                  {item.descricao && <p className="text-sm text-ink-soft mt-0.5">{item.descricao}</p>}
                  {item.controlaEstoque && (
                    <p className="text-xs text-ink-soft mt-1">
                      {semEstoque ? 'Esgotado' : `${item.qtdDisponivel} disponíveis`}
                    </p>
                  )}
                  <span className="font-mono text-herb-dark font-medium block mt-1">
                    R$ {Number(item.preco).toFixed(2)}
                  </span>
                </div>

                {semEstoque ? (
                  <span className="text-xs text-ink-soft shrink-0">Indisponível</span>
                ) : qtd === 0 ? (
                  <Button
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => definirQuantidade(item, 1)}
                  >
                    Adicionar
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      className="w-8 h-8 rounded-md border border-line text-ink hover:bg-parchment-dark"
                      onClick={() => definirQuantidade(item, qtd - 1)}
                    >
                      −
                    </button>
                    <span className="font-mono w-4 text-center">{qtd}</span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      disabled={qtd >= limiteQtd}
                      className="w-8 h-8 rounded-md border border-line text-ink hover:bg-parchment-dark disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => definirQuantidade(item, qtd + 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {quantidadeTotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-line bg-cream-card">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-ink-soft">{quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'}</p>
              <p className="font-mono text-herb-dark font-medium">R$ {valorTotal.toFixed(2)}</p>
            </div>
            <Button onClick={() => navigate('/checkout')}>Ver pedido</Button>
          </div>
        </div>
      )}
    </ClienteLayout>
  );
}
