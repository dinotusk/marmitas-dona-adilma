import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { ItemCardapio } from '@/types/domain';

export interface ItemCarrinho {
  itemCardapio: ItemCardapio;
  quantidade: number;
}

interface CarrinhoContextValue {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  valorTotal: number;
  definirQuantidade: (item: ItemCardapio, quantidade: number) => void;
  limpar: () => void;
}

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const definirQuantidade = useCallback((item: ItemCardapio, quantidade: number) => {
    setItens((atual) => {
      if (quantidade <= 0) {
        return atual.filter((i) => i.itemCardapio.id !== item.id);
      }
      const existe = atual.some((i) => i.itemCardapio.id === item.id);
      if (existe) {
        return atual.map((i) => (i.itemCardapio.id === item.id ? { ...i, quantidade } : i));
      }
      return [...atual, { itemCardapio: item, quantidade }];
    });
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const quantidadeTotal = useMemo(() => itens.reduce((soma, i) => soma + i.quantidade, 0), [itens]);
  const valorTotal = useMemo(
    () => itens.reduce((soma, i) => soma + Number(i.itemCardapio.preco) * i.quantidade, 0),
    [itens]
  );

  return (
    <CarrinhoContext.Provider value={{ itens, quantidadeTotal, valorTotal, definirQuantidade, limpar }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>');
  return ctx;
}
