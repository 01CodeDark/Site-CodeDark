import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Code2, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ehEquipe, rotuloPapel, type Product } from '@/lib/api';

const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const VERMELHO = '#ff534d';

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5"><img src={`${basePath}/codedark-logo.png`} alt="CodeDark" className={compacto ? 'h-9 w-9 object-contain' : 'h-10 w-10 object-contain'} />{!compacto && <span className="font-display text-[15px] font-extrabold tracking-[.2em] text-white">CODE<span className="text-[#ff534d]">DARK</span></span>}</Link>;
}

export function Botao({ children, variante = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'contorno' | 'fantasma' | 'perigo' }) {
  const estilos = {
    primario: 'bg-[#ff534d] text-white shadow-[0_10px_28px_rgba(255,83,77,.2)] hover:bg-[#ff6c64] disabled:opacity-40 disabled:shadow-none',
    contorno: 'border border-white/12 bg-white/[.03] text-[#e9edf2] hover:border-[#ff534d]/60 hover:bg-[#ff534d]/8 disabled:opacity-40',
    fantasma: 'text-[#a5afbf] hover:bg-white/[.06] hover:text-white disabled:opacity-40',
    perigo: 'border border-red-500/20 bg-red-500/8 text-red-300 hover:bg-red-500/15',
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[.98] ${estilos[variante]} ${className}`} {...props}>{children}</button>;
}

export function Campo({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">{label}</span><input className={`w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3.5 py-2.5 text-sm text-[#e9edf2] outline-none transition placeholder:text-[#59637a] focus:border-[#ff534d]/60 focus:ring-2 focus:ring-[#ff534d]/15 ${className}`} {...props} /></label>;
}

export function AreaTexto({ label, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">{label}</span><textarea className={`w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3.5 py-2.5 text-sm leading-6 text-[#e9edf2] outline-none transition placeholder:text-[#59637a] focus:border-[#ff534d]/60 focus:ring-2 focus:ring-[#ff534d]/15 ${className}`} {...props} /></label>;
}

export function Chip({ ativo = false, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { ativo?: boolean }) {
  return <button className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${ativo ? 'border-[#ff534d] bg-[#ff534d]/15 text-white' : 'border-white/10 bg-white/[.03] text-[#97a2b4] hover:border-white/25 hover:text-white'}`} {...props}>{children}</button>;
}

export function StatusChip({ status }: { status: string }) {
  const mapa: Record<string, string> = {
    pago: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    pendente: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    cancelado: 'border-red-500/25 bg-red-500/10 text-red-300',
  };
  const rotulos: Record<string, string> = { pago: 'Pago', pendente: 'Aguardando PIX', cancelado: 'Cancelado' };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${mapa[status] || 'border-white/10 bg-white/[.04] text-[#97a2b4]'}`}>{rotulos[status] || status}</span>;
}

export function Vazio({ icone, titulo, texto, children }: { icone: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] px-6 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.03] text-[#ff625b]">{icone}</div>
    <h3 className="mt-5 font-display text-lg font-bold text-white">{titulo}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-[#7f8b9d]">{texto}</p>
    {children && <div className="mt-6">{children}</div>}
  </div>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [local] = useLocation();
  const { usuario, sair } = useAuth();
  const equipe = ehEquipe(usuario);
  return <div className="min-h-[100dvh] bg-[#05080c] text-[#e9edf2]">
    <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#05080c]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-7 px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#8f99aa] md:flex">
          <Link href="/" className={local === '/' ? 'text-white' : 'hover:text-white'}>Loja</Link>
          {usuario && <Link href="/conta" className={local === '/conta' ? 'text-white' : 'hover:text-white'}>Minha biblioteca</Link>}
          {equipe && <Link href="/admin" className={local === '/admin' ? 'text-white' : 'hover:text-white'}>Painel</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {usuario
            ? <><span className="hidden text-xs text-[#8b96a8] lg:block">{usuario.name} · {rotuloPapel(usuario.role)}</span>
                <button onClick={() => { void sair(); setMenuAberto(false); }} className="rounded-lg p-2.5 text-[#9da7b7] hover:bg-white/[.05] hover:text-white" title="Sair"><LogOut size={17} /></button></>
            : <Link href="/entrar" className="hidden items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm font-semibold text-[#dce2eb] transition hover:border-[#ff534d]/60 hover:text-white sm:flex"><LogIn size={15} /> Entrar</Link>}
          <button className="rounded-lg p-2.5 text-[#c0c8d4] md:hidden" onClick={() => setMenuAberto(!menuAberto)}>{menuAberto ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {menuAberto && <div className="border-t border-white/[.07] bg-[#10121a] px-5 py-4 md:hidden"><div className="flex flex-col gap-1 text-sm">
        <Link href="/" className="rounded-lg px-3 py-3 text-[#b7c0ce]" onClick={() => setMenuAberto(false)}>Loja</Link>
        {usuario && <Link href="/conta" className="rounded-lg px-3 py-3 text-[#b7c0ce]" onClick={() => setMenuAberto(false)}>Minha biblioteca</Link>}
        {equipe && <Link href="/admin" className="rounded-lg px-3 py-3 text-[#b7c0ce]" onClick={() => setMenuAberto(false)}>Painel</Link>}
        {!usuario && <Link href="/entrar" className="rounded-lg px-3 py-3 text-[#b7c0ce]" onClick={() => setMenuAberto(false)}>Entrar</Link>}
      </div></div>}
    </header>
    {children}
    <footer className="border-t border-white/[.08] bg-[#040609]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-5 py-10 text-sm text-[#707b8e] md:flex-row md:items-center md:justify-between lg:px-8">
        <div><Logo compacto /><p className="mt-3 text-xs">Software direto ao ponto. Sem enrolação.</p></div>
        <div className="flex flex-wrap gap-6">
          <Link href="/conta" className="hover:text-white">Suporte pós-compra</Link>
          {equipe && <Link href="/admin" className="hover:text-white">Gerenciar loja</Link>}
          <span className="font-mono-ui text-[11px] text-[#4f596a]">CODEDARK / PRIVATE BY DEFAULT</span>
        </div>
      </div>
    </footer>
  </div>;
}

const TEMAS: Record<string, string> = {
  forge: 'from-[#551b21] via-[#1c1922] to-[#11131c]',
  pixel: 'from-[#193845] via-[#19222b] to-[#11131c]',
  vault: 'from-[#302048] via-[#1c1928] to-[#11131c]',
  regex: 'from-[#4a3218] via-[#24201c] to-[#11131c]',
  notes: 'from-[#193a32] via-[#192522] to-[#11131c]',
};

export function ArteProduto({ produto, grande = false }: { produto: Pick<Product, 'art' | 'photo' | 'name' | 'version' | 'category'>; grande?: boolean }) {
  return <div className={`scanline relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${TEMAS[produto.art] || TEMAS.forge} ${grande ? 'min-h-[380px]' : 'aspect-[1.55]'} p-5`}>
    {produto.photo && <img src={produto.photo} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff534d]/15 blur-3xl" />
    <div className="relative flex h-full flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.18em] text-white/70">
        <span>{produto.category || 'Software'}</span>
        <span className="font-mono-ui text-white/35">CD</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/35 text-[#ff625b]"><Code2 size={grande ? 27 : 22} /></div>
        <div>
          <div className="font-display text-xl font-extrabold tracking-tight text-white">{produto.name}</div>
          <div className="mt-1 text-xs text-white/60">v{produto.version}</div>
        </div>
      </div>
    </div>
  </div>;
}

