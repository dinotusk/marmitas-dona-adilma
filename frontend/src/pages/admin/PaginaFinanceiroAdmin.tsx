import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError, getAdminToken } from '@/lib/api';
import type { Cupom, DashboardFinanceiro, FormaPagamento, TipoDesconto } from '@/types/domain';

interface PorPagamento {
  formaPagamento: FormaPagamento;
  total: number;
  quantidade: number;
}

interface SaborVendido {
  sabor: string | null;
  quantidadeVendida: number | null;
}

interface ReceitaSemana {
  semanaInicio: string;
  total: number;
  quantidade: number;
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
};

function formatarData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
}

export function PaginaFinanceiroAdmin() {
  const [dashboard, setDashboard] = useState<DashboardFinanceiro | null>(null);
  const [porPagamento, setPorPagamento] = useState<PorPagamento[]>([]);
  const [saboresMaisVendidos, setSaboresMaisVendidos] = useState<SaborVendido[]>([]);
  const [receitaSemanal, setReceitaSemanal] = useState<ReceitaSemana[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const [novoCupom, setNovoCupom] = useState({ codigo: '', tipo: 'PERCENTUAL' as TipoDesconto, valor: '' });
  const [criandoCupom, setCriandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState<string | null>(null);

  function carregarCupons() {
    api
      .get<Cupom[]>('/cupons', true)
      .then(setCupons)
      .catch(() => {});
  }

  useEffect(() => {
    Promise.all([
      api.get<DashboardFinanceiro>('/financeiro/dashboard', true),
      api.get<PorPagamento[]>('/financeiro/relatorios/por-pagamento', true),
      api.get<SaborVendido[]>('/financeiro/relatorios/sabores-mais-vendidos', true),
      api.get<ReceitaSemana[]>('/financeiro/receita-semanal', true),
    ])
      .then(([d, p, s, r]) => {
        setDashboard(d);
        setPorPagamento(p);
        setSaboresMaisVendidos(s);
        setReceitaSemanal(r);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o financeiro'))
      .finally(() => setCarregando(false));
    carregarCupons();
  }, []);

  async function handleCriarCupom(e: FormEvent) {
    e.preventDefault();
    setErroCupom(null);
    setCriandoCupom(true);
    try {
      await api.post(
        '/cupons',
        { codigo: novoCupom.codigo.trim().toUpperCase(), tipo: novoCupom.tipo, valor: Number(novoCupom.valor) },
        true
      );
      setNovoCupom({ codigo: '', tipo: 'PERCENTUAL', valor: '' });
      carregarCupons();
    } catch (e) {
      setErroCupom(e instanceof ApiError ? e.message : 'Não foi possível criar o cupom');
    } finally {
      setCriandoCupom(false);
    }
  }

  async function alternarCupom(cupom: Cupom) {
    try {
      const atualizado = await api.patch<Cupom>(`/cupons/${cupom.id}`, { ativo: !cupom.ativo }, true);
      setCupons((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
    } catch {
      // Falha silenciosa: a lista continua com o estado anterior visível.
    }
  }

  async function exportarCsv() {
    setExportando(true);
    try {
      const resposta = await fetch('/api/financeiro/exportar', {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedidos-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

  const maiorReceitaSemana = Math.max(1, ...receitaSemanal.map((s) => s.total));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink mb-1">Financeiro</h1>
          <p className="text-ink-soft">Vendas pagas por período e relatórios gerais.</p>
        </div>
        <Button variant="ghost" onClick={exportarCsv} disabled={exportando} className="text-xs py-2 px-4">
          {exportando ? 'Exportando...' : 'Exportar pedidos (CSV)'}
        </Button>
      </div>

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
            <h2 className="font-display text-lg text-ink mb-3">Receita por semana</h2>
            {receitaSemanal.length === 0 && <p className="text-sm text-ink-soft">Sem dados ainda.</p>}
            <div className="flex flex-col gap-2">
              {receitaSemanal.map((s) => (
                <div key={s.semanaInicio} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-xs text-ink-soft">{formatarData(s.semanaInicio)}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-parchment">
                    <div
                      className="h-full rounded bg-herb"
                      style={{ width: `${Math.max(4, (s.total / maiorReceitaSemana) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-mono text-xs text-herb-dark">
                    R$ {s.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Cupons de desconto</h2>
            <div className="flex flex-col gap-2 mb-4">
              {cupons.length === 0 && <p className="text-sm text-ink-soft">Nenhum cupom cadastrado ainda.</p>}
              {cupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-ink">{c.codigo}</span>
                  <span className="text-ink-soft">
                    {c.tipo === 'PERCENTUAL' ? `${Number(c.valor)}%` : `R$ ${Number(c.valor).toFixed(2)}`} · {c.usosAtuais} usos
                  </span>
                  <button
                    type="button"
                    onClick={() => alternarCupom(c)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      c.ativo ? 'bg-herb/10 text-herb-dark' : 'bg-parchment text-ink-soft'
                    }`}
                  >
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleCriarCupom} className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
              <input
                value={novoCupom.codigo}
                onChange={(e) => setNovoCupom((atual) => ({ ...atual, codigo: e.target.value }))}
                placeholder="Código"
                required
                className="flex-1 min-w-[100px] px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                  focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
              />
              <select
                value={novoCupom.tipo}
                onChange={(e) => setNovoCupom((atual) => ({ ...atual, tipo: e.target.value as TipoDesconto }))}
                className="px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                  focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
              >
                <option value="PERCENTUAL">%</option>
                <option value="FIXO">R$</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={novoCupom.valor}
                onChange={(e) => setNovoCupom((atual) => ({ ...atual, valor: e.target.value }))}
                placeholder="Valor"
                required
                className="w-24 px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                  focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
              />
              <Button type="submit" disabled={criandoCupom} className="text-xs py-2 px-3">
                {criandoCupom ? 'Criando...' : 'Criar cupom'}
              </Button>
              {erroCupom && <span className="text-xs text-paprika-dark">{erroCupom}</span>}
            </form>
          </Card>

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
