import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';

interface ClienteHistorico {
  id: string;
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

function CardCliente({
  cliente,
  onAtualizado,
  onExcluido,
}: {
  cliente: ClienteHistorico;
  onAtualizado: (c: ClienteHistorico) => void;
  onExcluido: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      await api.patch(`/clientes/${cliente.id}`, { nome, telefone }, true);
      onAtualizado({ ...cliente, nome, telefone });
      setEditando(false);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir ${cliente.nome}? Só é possível se não houver pedidos ou planos no histórico.`)) return;
    setErro(null);
    try {
      await api.delete(`/clientes/${cliente.id}`, true);
      onExcluido(cliente.id);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível excluir');
    }
  }

  if (editando) {
    return (
      <Card className="flex flex-wrap items-center gap-3">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
            focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
        />
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Telefone"
          className="w-40 px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
            focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
        />
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-lg bg-herb px-3 py-1.5 text-xs font-bold text-cream-card hover:bg-herb-dark disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-vanilla"
        >
          Cancelar
        </button>
        {erro && <span className="w-full text-xs text-paprika-dark">{erro}</span>}
      </Card>
    );
  }

  return (
    <Card className="flex flex-wrap justify-between items-center gap-3">
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
          <p className="text-xs text-ink-soft mt-1">Favorito: {saborFavorito(cliente.saboresPreferidos)}</p>
        )}
        {cliente.pedidosCancelados > 0 && (
          <p className="text-xs text-paprika-dark mt-1">
            ⚠ {cliente.pedidosCancelados} {cliente.pedidosCancelados === 1 ? 'pedido cancelado' : 'pedidos cancelados'}
          </p>
        )}
        {erro && <p className="text-xs text-paprika-dark mt-1">{erro}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-herb-dark font-medium">R$ {cliente.valorTotalGasto.toFixed(2)}</p>
          <p className="text-xs text-ink-soft">
            {cliente.quantidadePedidos} {cliente.quantidadePedidos === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-vanilla"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={excluir}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-paprika-dark hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>
    </Card>
  );
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
          <CardCliente
            key={cliente.id}
            cliente={cliente}
            onAtualizado={(atualizado) =>
              setClientes((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)))
            }
            onExcluido={(id) => setClientes((atual) => atual.filter((c) => c.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
