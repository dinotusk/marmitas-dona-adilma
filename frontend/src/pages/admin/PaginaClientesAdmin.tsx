import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';

interface ClienteHistorico {
  nome: string;
  telefone: string;
  temConta: boolean;
  quantidadePedidos: number;
  pedidosCancelados: number;
  valorTotalGasto: number;
  saboresPreferidos: Record<string, number>;
}

function saborFavorito(saboresPreferidos: Record<string, number>): string | null {
  const entradas = Object.entries(saboresPreferidos);
  if (entradas.length === 0) return null;
  return entradas.sort((a, b) => b[1] - a[1])[0][0];
}

export function PaginaClientesAdmin() {
  const [clientes, setClientes] = useState<ClienteHistorico[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ClienteHistorico[]>('/financeiro/clientes', true)
      .then((lista) => setClientes(lista.sort((a, b) => b.valorTotalGasto - a.valorTotalGasto)))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os clientes'))
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = clientes.filter((c) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return c.nome.toLowerCase().includes(termo) || c.telefone.includes(termo);
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Clientes</h1>
      <p className="text-ink-soft mb-6">Histórico de quem já comprou.</p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou telefone..."
        className="w-full mb-6 px-3.5 py-2.5 rounded-xl border border-line bg-cream-card text-ink text-sm
          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
      />

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {!carregando && filtrados.length === 0 && (
        <Card><p className="text-ink-soft text-sm">Nenhum cliente encontrado.</p></Card>
      )}

      <div className="grid gap-3">
        {filtrados.map((cliente) => (
          <Card key={cliente.telefone} className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="font-medium text-ink">
                {cliente.nome}
                {cliente.temConta && (
                  <span className="badge-pill ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-herb/10 text-herb-dark align-middle">
                    conta
                  </span>
                )}
              </p>
              <p className="text-sm text-ink-soft">{cliente.telefone}</p>
              {saborFavorito(cliente.saboresPreferidos) && (
                <p className="text-xs text-ink-soft mt-1">
                  Favorito: {saborFavorito(cliente.saboresPreferidos)}
                </p>
              )}
              {cliente.pedidosCancelados > 0 && (
                <p className="text-xs text-paprika-dark mt-1">
                  ⚠ {cliente.pedidosCancelados} {cliente.pedidosCancelados === 1 ? 'pedido cancelado' : 'pedidos cancelados'}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-mono text-herb-dark font-medium">R$ {cliente.valorTotalGasto.toFixed(2)}</p>
              <p className="text-xs text-ink-soft">
                {cliente.quantidadePedidos} {cliente.quantidadePedidos === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
