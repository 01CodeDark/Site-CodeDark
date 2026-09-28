import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { AppShell, Botao, Campo } from '@/components/store';
import { useAuth } from '@/lib/auth';

export default function Entrar() {
  const [local, navigate] = useLocation();
  const { entrar, registrar } = useAuth();
  const next = new URLSearchParams(local.split('?')[1] || '').get('next') || '/conta';
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setOcupado(true);
    try {
      if (modo === 'entrar') await entrar(email, senha);
      else await registrar(nome, email, senha);
      navigate(next);
    } catch (err) {
      setErro((err as Error).message);
      setOcupado(false);
    }
  }

  return <AppShell>
    <main className="mx-auto flex max-w-[440px] flex-col px-5 pb-28 pt-16">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.03] text-[#ff625b]">
          {modo === 'entrar' ? <LogIn size={24} /> : <UserRound size={24} />}
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="mt-2 text-sm text-[#7f8b9d]">{modo === 'entrar' ? 'Acesse sua biblioteca e os chats dos pedidos.' : 'Sua conta acompanha compras, downloads e suporte.'}</p>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-white/[.08] bg-white/[.02] p-7">
        {modo === 'criar' && <Campo label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required />}
        <Campo label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
        <Campo label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
        {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs leading-5 text-red-300">{erro}</p>}
        <Botao type="submit" disabled={ocupado} className="mt-1 w-full">
          {ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </Botao>
        <button type="button" onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErro(''); }} className="mt-1 text-center text-xs text-[#7f8b9d] transition hover:text-white">
          {modo === 'entrar' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
        </button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-[#5f6b7f]">
        <ShieldCheck size={13} /> A primeira conta criada na loja vira a conta de administrador.
      </p>
      <Link href="/" className="mt-4 text-center text-xs text-[#7f8b9d] hover:text-white">← Voltar para a loja</Link>
    </main>
  </AppShell>;
}
