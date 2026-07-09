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
    <div className="space-y-4">
      <section className="hidden rounded-xl bg-cocoa px-6 py-5 text-vanilla lg:block">
        <p className="text-xs text-vanilla/60">Marmitas dona Adilma</p>
        <h1 className="mt-1 font-display text-4xl">Configurações</h1>
        <p className="mt-1 text-sm text-vanilla/60">Conta administrativa e segurança do acesso.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="bg-vanilla">
          <h2 className="font-display text-2xl leading-none text-ink">Dados da conta</h2>
          <div className="mt-4 rounded-lg bg-cream-card p-4">
            <div className="food-pattern mb-4 h-14 w-14 rounded-lg border border-line" />
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Nome</p>
                <p className="mt-1 font-semibold text-ink">{admin?.nome}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">E-mail</p>
                <p className="mt-1 text-sm text-ink">{admin?.email}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl leading-none text-ink">Trocar senha</h2>
          <p className="mt-1 text-sm text-ink-soft">Use uma senha com pelo menos 6 caracteres.</p>

          <form onSubmit={handleSubmit} className="mt-5 grid max-w-xl gap-3">
            <Input id="senhaAtual" label="Senha atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
            <Input id="novaSenha" label="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={6} required />
            <Input id="confirmarSenha" label="Confirmar nova senha" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} minLength={6} required />

            {erro && <p className="rounded-lg bg-paprika/10 px-3 py-2 text-sm text-paprika-dark">{erro}</p>}
            {sucesso && <p className="rounded-lg bg-herb/10 px-3 py-2 text-sm text-herb-dark">Senha atualizada com sucesso.</p>}

            <Button type="submit" disabled={salvando} className="justify-self-start">
              {salvando ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
