import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { Assinatura, Periodicidade, StatusAssinatura } from '@/types/domain';

const PERIODICIDADE_LABEL: Record<Periodicidade, string> = {
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
};

const STATUS_LABEL: Record<StatusAssinatura, string> = {
  ATIVA: 'Ativa',
  PAUSADA: 'Pausada',
  CANCELADA: 'Cancelada',
};

const STATUS_ESTILO: Record<StatusAssinatura, string> = {
  ATIVA: 'bg-herb text-cream-card',
  PAUSADA: 'bg-straw text-cocoa',
  CANCELADA: 'bg-ink-soft text-cream-card',
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function PaginaAssinaturasAdmin() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Assinatura[]>('/assinaturas', true)
      .then(setAssinaturas)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os planos'))
      .finally(() => setCarregando(false));
  }, []);

  const ativas = assinaturas.filter((a) => a.status === 'ATIVA').length;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Planos</h1>
      <p className="text-ink-soft mb-6">Assinaturas recorrentes dos clientes.</p>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && !carregando && (
        <Card className="border-paprika/40 mb-4">
          <p className="text-sm text-paprika-dark">{erro}</p>
        </Card>
      )}

      {!carregando && !erro && (
        <>
          <p className="mb-4 text-sm text-ink-soft">
            {assinaturas.length} plano(s) no total · {ativas} ativo(s)
          </p>

          {assinaturas.length === 0 && (
            <Card>
              <p className="text-sm text-ink-soft">Nenhum cliente tem plano ainda.</p>
            </Card>
          )}

          <div className="grid gap-3">
            {assinaturas.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{a.cliente?.nome ?? 'Cliente'}</p>
                  <p className="text-xs text-ink-soft">{a.cliente?.telefone}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {PERIODICIDADE_LABEL[a.periodicidade]} · {a.itensPadrao.reduce((soma, i) => soma + i.quantidade, 0)} marmita(s) por ciclo
                  </p>
                  {a.status === 'ATIVA' && (
                    <p className="mt-1 text-xs text-herb-dark">Próximo pedido em {formatarData(a.proximoPedidoEm)}</p>
                  )}
                </div>
                <span className={`stamp-badge stamp-badge--tilt-a px-2.5 py-1 text-[10px] ${STATUS_ESTILO[a.status]}`}>
                  {STATUS_LABEL[a.status]}
                </span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
