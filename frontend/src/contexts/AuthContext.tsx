import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface AdminInfo {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

interface AuthContextValue {
  admin: AdminInfo | null;
  login: (email: string, senha: string) => Promise<void>;
  definirSessao: (token: string, admin: AdminInfo) => void;
  logout: () => void;
  carregando: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(() => {
    const salvo = localStorage.getItem('admin_info');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(false);

  const login = useCallback(async (email: string, senha: string) => {
    setCarregando(true);
    try {
      const resposta = await api.post<{ token: string; admin: AdminInfo }>('/auth/login', { email, senha });
      localStorage.setItem('admin_token', resposta.token);
      localStorage.setItem('admin_info', JSON.stringify(resposta.admin));
      setAdmin(resposta.admin);
    } finally {
      setCarregando(false);
    }
  }, []);

  const definirSessao = useCallback((token: string, adminInfo: AdminInfo) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_info', JSON.stringify(adminInfo));
    setAdmin(adminInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, definirSessao, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
