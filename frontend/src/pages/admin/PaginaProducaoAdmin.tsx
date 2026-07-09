import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { FechamentoDia } from '@/types/domain';

function hojeLocal() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function PaginaProducaoAdmin() {
  const [data, setData] = useState(hojeLocal());
  const [fechamento, setFechamento] = useState<FechamentoDia | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    api
      .get<FechamentoDia>(`/producao/fechamento-dia?data=${data}`, true)
      .then(setFechamento)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar a produção do dia'))
      .finally(() => setCarregando(false));
  }, [data]);

  const saboresOrdenados = fechamento
    ? Object.entries(fechamento.quantidadePorSabor).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink mb-1">Produção</h1>
          <p className="text-ink-soft">Fechamento de produção do dia.</p>
        </div>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-line bg-cream-card text-ink text-sm
            focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
        />
      </div>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {fechamento && !carregando && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs text-ink-soft mb-1">Pedidos</p>
              <p className="font-display text-2xl text-ink">{fechamento.totalPedidos}</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-soft mb-1">Marmitas</p>
              <p className="font-display text-2xl text-ink">{fechamento.totalMarmitas}</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-soft mb-1">Prontas</p>
              <p className="font-display text-2xl text-herb-dark">{fechamento.marmitasProntas}</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-soft mb-1">Pendentes</p>
              <p className="font-display text-2xl text-paprika-dark">{fechamento.marmitasPendentes}</p>
            </Card>
          </div>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Quantidade por sabor</h2>
            {saboresOrdenados.length === 0 && (
              <p className="text-sm text-ink-soft">Nenhuma marmita a preparar nesse dia.</p>
            )}
            <div className="flex flex-col gap-2">
              {saboresOrdenados.map(([sabor, quantidade]) => (
                <div key={sabor} className="flex justify-between items-center text-sm">
                  <span className="text-ink">{sabor}</span>
                  <span className="font-mono text-ink-soft">{quantidade}x</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Observações especiais</h2>
            {fechamento.observacoesEspeciais.length === 0 && (
              <p className="text-sm text-ink-soft">Nenhuma observação nos pedidos desse dia.</p>
            )}
            <div className="flex flex-col gap-2">
              {fechamento.observacoesEspeciais.map((obs) => (
                <div key={obs.pedidoId} className="text-sm border-b border-line last:border-0 pb-2 last:pb-0">
                  <span className="font-mono text-ink-soft">#{obs.pedidoId.slice(0, 8)}</span>{' '}
                  <span className="text-ink">{obs.cliente}</span>
                  <p className="text-ink-soft">{obs.observacao}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
