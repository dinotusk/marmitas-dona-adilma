import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import { useCarrinho } from '@/contexts/CarrinhoContext';
import type { Cardapio, ItemCardapio } from '@/types/domain';

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ItemCard({ item, quantidade, onChange }: { item: ItemCardapio; quantidade: number; onChange: (qtd: number) => void }) {
  const semEstoque = item.controlaEstoque && item.qtdDisponivel <= 0;
  const limiteQtd = item.controlaEstoque ? item.qtdDisponivel : 99;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="food-pattern relative h-32 border-b border-line">
        <span className="absolute left-3 top-3 rounded-full bg-cream-card px-2.5 py-1 font-mono text-[10px] font-medium uppercase text-herb-dark">
          {semEstoque ? 'Esgotado' : 'Disponível'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-display text-xl leading-tight text-ink">{item.sabor}</h2>
        {item.descricao && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{item.descricao}</p>}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <span className="font-mono text-base font-semibold text-herb-dark">{formatarMoeda(item.preco)}</span>
            {item.controlaEstoque && !semEstoque && (
              <p className="mt-1 text-xs text-ink-soft">{item.qtdDisponivel} unidades</p>
            )}
          </div>

          {semEstoque ? (
            <span className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-soft">Indisponível</span>
          ) : quantidade === 0 ? (
            <Button variant="ghost" className="px-3 py-2" onClick={() => onChange(1)}>
              Adicionar
            </Button>
          ) : (
            <div className="grid grid-cols-[34px_28px_34px] items-center rounded-lg border border-line bg-parchment">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                className="h-9 rounded-l-lg text-lg font-semibold hover:bg-vanilla"
                onClick={() => onChange(quantidade - 1)}
              >
                -
              </button>
              <span className="font-mono text-sm text-center">{quantidade}</span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={quantidade >= limiteQtd}
                className="h-9 rounded-r-lg text-lg font-semibold hover:bg-vanilla disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => onChange(quantidade + 1)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

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
      <section className="grid gap-6 rounded-xl bg-herb-light p-5 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <span className="badge-pill rounded-full bg-paprika px-3 py-1 text-[10px] text-cream-card">Novo por aqui?</span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[0.95] text-ink sm:text-6xl">
            Marmita caseira, feita com carinho, direto na sua porta
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">
            Comida de verdade, em porções práticas para organizar sua semana com sabor e tranquilidade.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => document.getElementById('cardapio-semana')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver cardápio da semana
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
              Como funciona
            </Button>
          </div>
        </div>

        <div className="relative min-h-64 rounded-xl bg-vanilla p-5">
          <div className="food-pattern h-full min-h-56 rounded-lg border border-line" />
          <div className="absolute -bottom-3 left-8 h-10 w-10 rounded-full bg-herb" />
          <div className="absolute right-10 top-0 h-16 w-28 rounded-b-xl bg-straw" />
        </div>
      </section>

      <section id="como-funciona" className="grid gap-3 border-b border-line bg-vanilla px-5 py-5 sm:grid-cols-3 sm:px-8">
        {[
          ['1', 'Escolha o plano', 'Semanal, quinzenal ou mensal.'],
          ['2', 'Monte o cardápio', 'Pratos reais, tudo sem mistério.'],
          ['3', 'Receba em casa', 'Congelada, pronta para aquecer.'],
        ].map(([numero, titulo, texto]) => (
          <div key={numero} className="flex gap-3">
            <span className="font-display text-2xl text-paprika">{numero}</span>
            <div>
              <h2 className="text-sm font-semibold text-ink">{titulo}</h2>
              <p className="mt-1 text-xs text-ink-soft">{texto}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="cardapio-semana" className="py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-ink">Cardápio da semana</h2>
            <p className="mt-1 text-sm text-ink-soft">Escolha suas marmitas favoritas para essa semana.</p>
          </div>
          {cardapio && (
            <span className="badge-pill rounded-full bg-herb/10 px-3 py-1 text-[10px] text-herb-dark">
              {cardapio.itens.length} opções
            </span>
          )}
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

        {cardapio && !carregando && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cardapio.itens.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                quantidade={quantidadeNoCarrinho(item.id)}
                onChange={(qtd) => definirQuantidade(item, qtd)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-24 rounded-xl bg-cocoa px-5 py-8 text-vanilla sm:px-8">
        <h2 className="font-display text-3xl">Primeiro pedido? Ganhe 15% de desconto</h2>
        <p className="mt-2 max-w-xl text-sm text-vanilla/70">Fale com a equipe para conhecer os combos da semana.</p>
        <Button variant="secondary" className="mt-5" onClick={() => document.getElementById('cardapio-semana')?.scrollIntoView({ behavior: 'smooth' })}>
          Criar minha semana
        </Button>
      </section>

      {quantidadeTotal > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div>
              <p className="text-xs text-ink-soft">
                {quantidadeTotal} {quantidadeTotal === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
              <p className="font-mono text-lg font-semibold text-herb-dark">{formatarMoeda(valorTotal)}</p>
            </div>
            <Button onClick={() => navigate('/checkout')}>Ver pedido</Button>
          </div>
        </div>
      )}
    </ClienteLayout>
  );
}
