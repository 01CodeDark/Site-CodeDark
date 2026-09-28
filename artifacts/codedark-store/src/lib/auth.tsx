import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { get, post, type Usuario } from '@/lib/api';

type AuthCtx = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  registrar: (nome: string, email: string, senha: string) => Promise<Usuario>;
  sair: () => Promise<void>;
  atualizar: (u: Usuario | null) => void;
  recarregar: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const data = await get<{ user: Usuario | null }>('/auth/me');
      setUsuario(data.user);
    } catch {
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const u = await post<Usuario>('/auth/login', { email, password: senha });
    setUsuario(u);
  }, []);

  const registrar = useCallback(async (nome: string, email: string, senha: string) => {
    const u = await post<Usuario>('/auth/register', { name: nome, email, password: senha });
    setUsuario(u);
    return u;
  }, []);

  const sair = useCallback(async () => {
    try { await post('/auth/logout'); } finally { setUsuario(null); }
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    usuario, carregando, entrar, registrar, sair,
    atualizar: setUsuario, recarregar,
  }), [usuario, carregando, entrar, registrar, sair, recarregar]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth precisa do AuthProvider');
  return ctx;
}
