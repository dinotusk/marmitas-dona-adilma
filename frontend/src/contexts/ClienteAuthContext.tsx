import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Cliente } from '@/types/domain';

interface ClienteAuthContextValue {
  cliente: Cliente | null;
  cadastrar: (dados: { nome: string; telefone: string; endereco: string; senha: string }) => Promise<void>;
  login: (telefone: string, senha: string) => Promise<void>;
  logout: () => void;
  carregando: boolean;
}

const ClienteAuthContext = createContext<ClienteAuthContextValue | null>(null);

function salvarSessao(token: string, cliente: Cliente) {
  localStorage.setItem('cliente_token', token);
  localStorage.setItem('cliente_info', JSON.stringify(cliente));
}

export function ClienteAuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(() => {
    const salvo = localStorage.getItem('cliente_info');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(false);

  const cadastrar = useCallback(
    async (dados: { nome: string; telefone: string; endereco: string; senha: string }) => {
      setCarregando(true);
      try {
        const resposta = await api.post<{ token: string; cliente: Cliente }>('/clientes/cadastro', dados);
        salvarSessao(resposta.token, resposta.cliente);
        setCliente(resposta.cliente);
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  const login = useCallback(async (telefone: string, senha: string) => {
    setCarregando(true);
    try {
      const resposta = await api.post<{ token: string; cliente: Cliente }>('/clientes/login', { telefone, senha });
      salvarSessao(resposta.token, resposta.cliente);
      setCliente(resposta.cliente);
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente_info');
    setCliente(null);
  }, []);

  return (
    <ClienteAuthContext.Provider value={{ cliente, cadastrar, login, logout, carregando }}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error('useClienteAuth precisa estar dentro de <ClienteAuthProvider>');
  return ctx;
}
