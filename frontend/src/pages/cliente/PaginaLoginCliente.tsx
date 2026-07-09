import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { ApiError } from '@/lib/api';

export function PaginaLoginCliente() {
  const { login, cadastrar, carregando } = useClienteAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      if (modo === 'entrar') {
        await login(telefone, senha);
      } else {
        await cadastrar({ nome, telefone, endereco, senha });
      }
      navigate('/meus-pedidos');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível continuar');
    }
  }

  return (
    <ClienteLayout>
      <div className="flex justify-center py-6">
        <Card className="w-full max-w-sm">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setModo('entrar')}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium ${
                modo === 'entrar' ? 'bg-herb/10 text-herb-dark' : 'text-ink-soft hover:bg-parchment-dark'
              }`}
            >
              Já sou cliente
            </button>
            <button
              type="button"
              onClick={() => setModo('cadastrar')}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium ${
                modo === 'cadastrar' ? 'bg-herb/10 text-herb-dark' : 'text-ink-soft hover:bg-parchment-dark'
              }`}
            >
              Criar conta
            </button>
          </div>

          <h1 className="font-display text-2xl text-ink mb-1">
            {modo === 'entrar' ? 'Entrar na minha conta' : 'Criar minha conta'}
          </h1>
          <p className="text-sm text-ink-soft mb-6">
            {modo === 'entrar'
              ? 'Acesse pra ver seus pedidos anteriores.'
              : 'Guarde seu endereço e acompanhe seus pedidos sem precisar redigitar tudo.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {modo === 'cadastrar' && (
              <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            )}
            <Input
              id="telefone"
              type="tel"
              label="Telefone (com WhatsApp)"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              minLength={8}
              required
            />
            {modo === 'cadastrar' && (
              <Input
                id="endereco"
                label="Endereço de entrega"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            )}
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

            <Button type="submit" disabled={carregando} className="mt-2">
              {carregando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        </Card>
      </div>
    </ClienteLayout>
  );
}
