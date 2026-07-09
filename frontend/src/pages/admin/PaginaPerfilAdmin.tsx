import { useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';

export function PaginaPerfilAdmin() {
  const { admin } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação não bate com a nova senha.');
      return;
    }

    setSalvando(true);
    try {
      await api.patch('/auth/senha', { senhaAtual, novaSenha }, true);
      setSucesso(true);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível trocar a senha');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Meu perfil</h1>
      <p className="text-ink-soft mb-6">Dados da conta e troca de senha.</p>

      <Card className="mb-6">
        <h2 className="font-display text-lg text-ink mb-3">Conta</h2>
        <p className="text-sm text-ink-soft">{admin?.nome}</p>
        <p className="text-sm text-ink-soft">{admin?.email}</p>
      </Card>

      <Card>
        <h2 className="font-display text-lg text-ink mb-4">Trocar senha</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
          <Input
            id="senhaAtual"
            label="Senha atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            required
          />
          <Input
            id="novaSenha"
            label="Nova senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            minLength={6}
            required
          />
          <Input
            id="confirmarSenha"
            label="Confirmar nova senha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            minLength={6}
            required
          />

          {erro && <p className="text-sm text-paprika-dark">{erro}</p>}
          {sucesso && <p className="text-sm text-herb-dark">Senha atualizada com sucesso.</p>}

          <Button type="submit" disabled={salvando} className="self-start">
            {salvando ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
