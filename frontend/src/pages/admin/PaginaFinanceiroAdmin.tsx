import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { DashboardFinanceiro, FormaPagamento } from '@/types/domain';

interface PorPagamento {
  formaPagamento: FormaPagamento;
  total: number;
  quantidade: number;
}

interface SaborVendido {
  sabor: string | null;
  quantidadeVendida: number | null;
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

export function PaginaFinanceiroAdmin() {
  const [dashboard, setDashboard] = useState<DashboardFinanceiro | null>(null);
  const [porPagamento, setPorPagamento] = useState<PorPagamento[]>([]);
  const [saboresMaisVendidos, setSaboresMaisVendidos] = useState<SaborVendido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<DashboardFinanceiro>('/financeiro/dashboard', true),
      api.get<PorPagamento[]>('/financeiro/relatorios/por-pagamento', true),
      api.get<SaborVendido[]>('/financeiro/relatorios/sabores-mais-vendidos', true),
    ])
      .then(([d, p, s]) => {
        setDashboard(d);
        setPorPagamento(p);
        setSaboresMaisVendidos(s);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o financeiro'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Financeiro</h1>
      <p className="text-ink-soft mb-6">Vendas pagas por período e relatórios gerais.</p>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {dashboard && !carregando && (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs text-ink-soft mb-1">Hoje</p>
              <p className="font-display text-2xl text-herb-dark">R$ {Number(dashboard.vendasDia.total).toFixed(2)}</p>
              <p className="text-xs text-ink-soft mt-1">{dashboard.vendasDia.quantidade} pedidos pagos</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-soft mb-1">Essa semana</p>
              <p className="font-display text-2xl text-herb-dark">R$ {Number(dashboard.vendasSemana.total).toFixed(2)}</p>
              <p className="text-xs text-ink-soft mt-1">{dashboard.vendasSemana.quantidade} pedidos pagos</p>
            </Card>
            <Card>
              <p className="text-xs text-ink-soft mb-1">Esse mês</p>
              <p className="font-display text-2xl text-herb-dark">R$ {Number(dashboard.vendasMes.total).toFixed(2)}</p>
              <p className="text-xs text-ink-soft mt-1">{dashboard.vendasMes.quantidade} pedidos pagos</p>
            </Card>
          </div>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Vendas por forma de pagamento</h2>
            {porPagamento.length === 0 && <p className="text-sm text-ink-soft">Nenhum pedido registrado ainda.</p>}
            <div className="flex flex-col gap-2">
              {porPagamento.map((p) => (
                <div key={p.formaPagamento} className="flex justify-between items-center text-sm">
                  <span className="text-ink">{FORMA_PAGAMENTO_LABEL[p.formaPagamento] ?? p.formaPagamento}</span>
                  <span className="text-ink-soft">
                    <span className="font-mono text-herb-dark">R$ {Number(p.total).toFixed(2)}</span>{' '}
                    ({p.quantidade} {p.quantidade === 1 ? 'pedido' : 'pedidos'})
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Sabores mais vendidos</h2>
            {saboresMaisVendidos.length === 0 && <p className="text-sm text-ink-soft">Nenhuma venda registrada ainda.</p>}
            <div className="flex flex-col gap-2">
              {saboresMaisVendidos.map((s, i) => (
                <div key={s.sabor ?? i} className="flex justify-between items-center text-sm">
                  <span className="text-ink">{s.sabor ?? '—'}</span>
                  <span className="font-mono text-ink-soft">{s.quantidadeVendida ?? 0}x</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
