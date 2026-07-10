import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';

interface ConviteInfo {
  email: string;
  cargo: string;
}

export function PaginaAceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const { definirSessao } = useAuth();
  const navigate = useNavigate();

  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroInicial, setErroInicial] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<ConviteInfo>(`/equipe/convites/${token}`)
      .then(setConvite)
      .catch((e) => setErroInicial(e instanceof ApiError ? e.message : 'Convite inválido ou expirado'))
      .finally(() => setCarregando(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await api.post<{ token: string; admin: { id: string; nome: string; email: string; cargo: string } }>(
        `/equipe/convites/${token}/aceitar`,
        { nome, senha }
      );
      definirSessao(resposta.token, resposta.admin);
      navigate('/admin/pedidos');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível aceitar o convite');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink mb-1">Entrar para a equipe</h1>

        {carregando && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {erroInicial && !carregando && <p className="text-sm text-paprika-dark">{erroInicial}</p>}

        {convite && !carregando && (
          <>
            <p className="text-sm text-ink-soft mb-6">Convite para {convite.email}. Defina seu nome e senha para começar.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input
                id="senha"
                type="password"
                label="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
              />
              {erro && <p className="text-sm text-paprika-dark">{erro}</p>}
              <Button type="submit" disabled={enviando} className="mt-2">
                {enviando ? 'Entrando...' : 'Aceitar convite e entrar'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
