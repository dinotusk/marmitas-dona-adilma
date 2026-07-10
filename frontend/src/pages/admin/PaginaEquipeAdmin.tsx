import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { CargoAdmin, ConviteEquipe, MembroEquipe } from '@/types/domain';

const CARGOS: { valor: CargoAdmin; label: string }[] = [
  { valor: 'DONA', label: 'Dona' },
  { valor: 'COZINHA', label: 'Cozinha' },
  { valor: 'ATENDIMENTO', label: 'Atendimento' },
];

const CARGO_LABEL: Record<CargoAdmin, string> = {
  DONA: 'Dona',
  COZINHA: 'Cozinha',
  ATENDIMENTO: 'Atendimento',
};

export function PaginaEquipeAdmin() {
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [convites, setConvites] = useState<ConviteEquipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState<CargoAdmin>('ATENDIMENTO');
  const [criando, setCriando] = useState(false);
  const [erroConvite, setErroConvite] = useState<string | null>(null);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);

  function carregar() {
    Promise.all([
      api.get<MembroEquipe[]>('/equipe', true),
      api.get<ConviteEquipe[]>('/equipe/convites', true),
    ])
      .then(([m, c]) => {
        setMembros(m);
        setConvites(c);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar a equipe'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleConvidar(e: FormEvent) {
    e.preventDefault();
    setErroConvite(null);
    setLinkGerado(null);
    setCriando(true);
    try {
      const convite = await api.post<ConviteEquipe>('/equipe/convites', { email, cargo }, true);
      setEmail('');
      setCargo('ATENDIMENTO');
      setLinkGerado(convite.linkConvite ? `${window.location.origin}${convite.linkConvite}` : null);
      carregar();
    } catch (e) {
      setErroConvite(e instanceof ApiError ? e.message : 'Não foi possível criar o convite');
    } finally {
      setCriando(false);
    }
  }

  async function cancelarConvite(id: string) {
    try {
      await api.delete(`/equipe/convites/${id}`, true);
      setConvites((atual) => atual.filter((c) => c.id !== id));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível cancelar o convite');
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Equipe</h1>
      <p className="text-ink-soft mb-6">Administradoras com acesso ao painel.</p>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {!carregando && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Membros</h2>
            <div className="flex flex-col gap-2">
              {membros.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-ink">{m.nome}</p>
                    <p className="text-xs text-ink-soft">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-herb/10 px-3 py-1 text-xs font-bold text-herb-dark">
                    {CARGO_LABEL[m.cargo]}
                  </span>
                </div>
              ))}
            </div>

            {convites.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Convites pendentes</p>
                <div className="flex flex-col gap-2">
                  {convites.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-ink">{c.email}</p>
                        <p className="text-xs text-ink-soft">{CARGO_LABEL[c.cargo]}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelarConvite(c.id)}
                        className="text-xs text-paprika-dark hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-3">Convidar para a equipe</h2>
            <form onSubmit={handleConvidar} className="grid gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="h-10 rounded-lg border border-line bg-cream-card px-3.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
              />
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value as CargoAdmin)}
                className="h-10 rounded-lg border border-line bg-cream-card px-3.5 text-sm text-ink focus:border-herb focus:outline-none focus:ring-2 focus:ring-herb/40"
              >
                {CARGOS.map((c) => (
                  <option key={c.valor} value={c.valor}>{c.label}</option>
                ))}
              </select>

              {erroConvite && <p className="text-sm text-paprika-dark">{erroConvite}</p>}
              {linkGerado && (
                <p className="rounded-lg bg-herb/10 px-3 py-2 text-xs text-herb-dark break-all">
                  Convite criado. Envie este link: {linkGerado}
                </p>
              )}

              <Button type="submit" disabled={criando} className="justify-self-start">
                {criando ? 'Criando...' : 'Criar convite'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
