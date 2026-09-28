import { useEffect, useMemo, useState } from 'react';
import type { ButtonHTMLAttributes, Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  ChevronLeft,
  CircleHelp,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileCode2,
  Filter,
  FolderOpen,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';

type Product = {
  id: string;
  nome: string;
  resumo: string;
  descricao: string;
  categoria: string;
  versao: string;
  preco: number;
  precoAntigo?: number;
  avaliacao: number;
  downloads: number;
  destaque: boolean;
  imagem: 'forge' | 'pixel' | 'vault' | 'regex' | 'notes';
  entrega: 'Download imediato' | 'Chave de licença' | 'Pacote de modelos';
  linkDownload: string;
  tags: string[];
};

type Cupom = { codigo: string; desconto: number; usos: number; ativo: boolean };
type Mensagem = {
  id: string;
  remetente: 'cliente' | 'suporte';
  texto: string;
  horario: string;
};
type Usuario = { nome: string; email: string; administrador: boolean };

const produtosIniciais: Product[] = [
  {
    id: 'terminal-forge',
    nome: 'Terminal Forge',
    resumo: 'Um centro de comando para quem opera sistemas de verdade.',
    descricao: 'Um lançador de comandos rápido e focado para o trabalho repetitivo. Encadeie scripts, fixe ambientes e atravesse sua stack sem sair do teclado.',
    categoria: 'Ferramentas de desenvolvimento',
    versao: '2.4.1',
    preco: 24,
    precoAntigo: 32,
    avaliacao: 4.9,
    downloads: 12840,
    destaque: true,
    imagem: 'forge',
    entrega: 'Download imediato',
    linkDownload: 'https://codedark.local/downloads/terminal-forge',
    tags: ['CLI', 'Produtividade', 'macOS'],
  },
  {
    id: 'pixel-inspector',
    nome: 'Pixel Inspector',
    resumo: 'Veja exatamente o que o navegador está vendo.',
    descricao: 'Kit de precisão para auditar interfaces responsivas. Capture estilos calculados, compare breakpoints e exporte notas de handoff em um workspace silencioso.',
    categoria: 'Design e frontend',
    versao: '1.8.0',
    preco: 18,
    avaliacao: 4.8,
    downloads: 8320,
    destaque: true,
    imagem: 'pixel',
    entrega: 'Download imediato',
    linkDownload: 'https://codedark.local/downloads/pixel-inspector',
    tags: ['Browser', 'CSS', 'QA'],
  },
  {
    id: 'vault-sync',
    nome: 'Vault Sync',
    resumo: 'Entregas privadas de arquivos. Sem ruído.',
    descricao: 'Links de entrega criptografados e com expiração para equipes que enviam ativos sensíveis. Solte um pacote, defina a janela e mantenha seu trabalho fora da internet pública.',
    categoria: 'Operações',
    versao: '3.1.2',
    preco: 42,
    precoAntigo: 55,
    avaliacao: 4.7,
    downloads: 4690,
    destaque: false,
    imagem: 'vault',
    entrega: 'Chave de licença',
    linkDownload: 'https://codedark.local/licenses/vault-sync',
    tags: ['Segurança', 'Arquivos', 'Equipes'],
  },
  {
    id: 'regex-blacksmith',
    nome: 'Regex Blacksmith',
    resumo: 'Transforme texto bagunçado em dados úteis.',
    descricao: 'Construa, teste e documente expressões regulares com uma bancada feita para parsing de produção. Salve receitas localmente e compartilhe padrões legíveis.',
    categoria: 'Ferramentas de desenvolvimento',
    versao: '1.2.6',
    preco: 12,
    avaliacao: 4.6,
    downloads: 11920,
    destaque: false,
    imagem: 'regex',
    entrega: 'Download imediato',
    linkDownload: 'https://codedark.local/downloads/regex-blacksmith',
    tags: ['Regex', 'Dados', 'Utilitário'],
  },
  {
    id: 'release-notes-kit',
    nome: 'Release Notes Kit',
    resumo: 'Envie a atualização. Explique com clareza.',
    descricao: 'Um sistema prático de notas de versão para times de produto. Transforme commits em changelogs que seus clientes conseguem realmente escanear.',
    categoria: 'Operações',
    versao: '2.0.3',
    preco: 15,
    avaliacao: 4.8,
    downloads: 5750,
    destaque: false,
    imagem: 'notes',
    entrega: 'Pacote de modelos',
    linkDownload: 'https://codedark.local/downloads/release-notes-kit',
    tags: ['Escrita', 'Git', 'Equipes'],
  },
];

const cuponsIniciais: Cupom[] = [
  { codigo: 'SHIPDARK', desconto: 15, usos: 72, ativo: true },
  { codigo: 'OPERADOR10', desconto: 10, usos: 184, ativo: true },
  { codigo: 'ARQUIVO25', desconto: 25, usos: 31, ativo: false },
];

const mensagensIniciais: Mensagem[] = [
  { id: 'm1', remetente: 'suporte', texto: 'Bem-vindo ao suporte CodeDark. O que você está tentando colocar no ar?', horario: '09:42' },
  { id: 'm2', remetente: 'cliente', texto: 'Preciso de uma licença do Vault Sync em uma segunda máquina.', horario: '09:48' },
  { id: 'm3', remetente: 'suporte', texto: 'Sem problema. Sua licença cobre dois dispositivos. Adicionei o segundo acesso à sua conta.', horario: '09:51' },
];

const categorias = ['Todos os produtos', 'Ferramentas de desenvolvimento', 'Design e frontend', 'Operações'];
const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

const memoria = {
  ler<T>(chave: string, padrao: T): T {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? (JSON.parse(valor) as T) : padrao;
    } catch {
      return padrao;
    }
  },
  salvar<T>(chave: string, valor: T) {
    localStorage.setItem(chave, JSON.stringify(valor));
  },
};

function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
      <img src={`${basePath}/codedark-logo.png`} alt="CodeDark" className={compacto ? 'h-9 w-9 object-contain' : 'h-10 w-10 object-contain'} />
      {!compacto && <span className="font-display text-[15px] font-extrabold tracking-[.2em] text-white">CODE<span className="text-[#ff534d]">DARK</span> <span className="text-[#ff534d]">㋛</span></span>}
    </Link>
  );
}

function Botao({ children, variante = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'contorno' | 'fantasma' | 'perigo' }) {
  const estilos = {
    primario: 'bg-[#ff534d] text-white shadow-[0_10px_28px_rgba(255,83,77,.2)] hover:bg-[#ff6c64]',
    contorno: 'border border-white/12 bg-white/[.03] text-[#e9edf2] hover:border-[#ff534d]/60 hover:bg-[#ff534d]/8',
    fantasma: 'text-[#a5afbf] hover:bg-white/[.06] hover:text-white',
    perigo: 'border border-red-500/20 bg-red-500/8 text-red-300 hover:bg-red-500/15',
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[.98] ${estilos[variante]} ${className}`} {...props}>{children}</button>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(() => memoria.ler('codedark-usuario', null));
  const sair = () => {
    memoria.salvar('codedark-usuario', null);
    setUsuario(null);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0b0f] text-[#e9edf2]">
      <header className="sticky top-0 z-40 border-b border-white/[.07] bg-[#0a0b0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-7 px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#8f99aa] md:flex">
            <Link href="/" className="transition-colors hover:text-white">Loja</Link>
            <Link href="/conta" className="transition-colors hover:text-white">Minha biblioteca</Link>
            <Link href="/admin" className="transition-colors hover:text-white">Administração</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {usuario ? (
              <>
                <span className="hidden text-xs text-[#8b96a8] lg:block">{usuario.nome}</span>
                <button onClick={sair} className="rounded-lg p-2.5 text-[#9da7b7] hover:bg-white/[.05] hover:text-white" title="Sair" data-testid="button-logout"><LogOut size={17} /></button>
              </>
            ) : <Link href="/entrar" className="hidden items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm font-semibold text-[#dce2eb] transition hover:border-[#ff534d]/60 hover:text-white sm:flex"><LogIn size={15} /> Entrar</Link>}
            <button className="rounded-lg p-2.5 text-[#c0c8d4] md:hidden" onClick={() => setMenuAberto(!menuAberto)} data-testid="button-mobile-menu">{menuAberto ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {menuAberto && <div className="border-t border-white/[.07] bg-[#10121a] px-5 py-4 md:hidden"><div className="flex flex-col gap-1 text-sm"><Link href="/" onClick={() => setMenuAberto(false)} className="rounded-lg px-3 py-3 text-[#b7c0ce]">Loja</Link><Link href="/conta" onClick={() => setMenuAberto(false)} className="rounded-lg px-3 py-3 text-[#b7c0ce]">Minha biblioteca</Link><Link href="/admin" onClick={() => setMenuAberto(false)} className="rounded-lg px-3 py-3 text-[#b7c0ce]">Administração</Link><Link href="/entrar" onClick={() => setMenuAberto(false)} className="rounded-lg px-3 py-3 text-[#b7c0ce]">Entrar / cadastrar</Link></div></div>}
      </header>
      {children}
      <footer className="border-t border-white/[.07] bg-[#08090c]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-5 py-10 text-sm text-[#707b8e] md:flex-row md:items-center md:justify-between lg:px-8">
          <div><Logo compacto /><p className="mt-3 text-xs">Software útil. Enviado em silêncio.</p></div>
          <div className="flex flex-wrap gap-6"><Link href="/conta" className="hover:text-white">Suporte</Link><Link href="/admin" className="hover:text-white">Gerenciar loja</Link><span className="font-mono-ui text-[11px] text-[#4f596a]">BUILD 2026 / PRIVADO POR PADRÃO</span></div>
        </div>
      </footer>
    </div>
  );
}

function ArteProduto({ produto, grande = false }: { produto: Product; grande?: boolean }) {
  const temas: Record<string, string> = { forge: 'from-[#551b21] via-[#1c1922] to-[#11131c]', pixel: 'from-[#193845] via-[#19222b] to-[#11131c]', vault: 'from-[#302048] via-[#1c1928] to-[#11131c]', regex: 'from-[#4a3218] via-[#24201c] to-[#11131c]', notes: 'from-[#193a32] via-[#192522] to-[#11131c]' };
  const linhas = produto.imagem === 'forge' ? ['sudo', 'deploy', '—quiet'] : produto.imagem === 'pixel' ? ['viewport', 'inspect', 'render'] : produto.imagem === 'vault' ? ['encrypt', 'share', 'expire'] : produto.imagem === 'regex' ? ['match', 'capture', 'parse'] : ['draft', 'review', 'ship'];
  return <div className={`scanline relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${temas[produto.imagem]} ${grande ? 'min-h-[400px]' : 'aspect-[1.55]'} p-5`}><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff534d]/15 blur-3xl" /><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.18em] text-white/50"><span>{produto.categoria}</span><span className="font-mono-ui text-white/30">0{produto.id.length % 9 + 1}</span></div><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/25 text-[#ff625b]"><Code2 size={grande ? 27 : 22} /></div><div><div className="font-display text-xl font-extrabold tracking-tight text-white">{produto.nome}</div><div className="mt-1 text-xs text-white/50">v{produto.versao} / estável</div></div></div><div className="flex gap-2 font-mono-ui text-[11px] text-white/40">{linhas.map((linha) => <span key={linha} className="rounded border border-white/10 bg-black/20 px-2 py-1">{linha}</span>)}</div></div></div>;
}

function Avaliacao({ valor }: { valor: number }) {
  return <div className="flex items-center gap-1.5 text-xs"><span className="flex gap-0.5 text-[#ffb454]">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={12} fill={i < Math.round(valor) ? 'currentColor' : 'none'} />)}</span><span className="font-mono-ui text-[#aeb7c5]">{valor.toFixed(1)}</span></div>;
}

function CartaoProduto({ produto }: { produto: Product }) {
  return <Link href={`/produto/${produto.id}`} className="group block" data-testid={`card-product-${produto.id}`}><ArteProduto produto={produto} /><div className="pt-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-[16px] font-bold text-white transition-colors group-hover:text-[#ff6b63]">{produto.nome}</h3><p className="mt-1 text-sm leading-relaxed text-[#7f8b9d]">{produto.resumo}</p></div><div className="pt-0.5 text-right"><span className="font-mono-ui text-sm font-medium text-white">R$ {produto.preco.toFixed(2).replace('.', ',')}</span>{produto.precoAntigo && <del className="block text-[11px] text-[#596373]">R$ {produto.precoAntigo.toFixed(2).replace('.', ',')}</del>}</div></div><div className="mt-3 flex items-center justify-between"><Avaliacao valor={produto.avaliacao} /><span className="text-[11px] text-[#657084]">{produto.downloads.toLocaleString('pt-BR')} downloads</span></div></div></Link>;
}

function Home() {
  const [produtos] = useCatalogo();
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]);
  const filtrados = useMemo(() => produtos.filter((p) => (categoria === categorias[0] || p.categoria === categoria) && `${p.nome} ${p.resumo} ${p.tags.join(' ')}`.toLowerCase().includes(busca.toLowerCase())), [produtos, busca, categoria]);
  const destaques = produtos.filter((p) => p.destaque);
  const lista = categoria === categorias[0] && !busca ? filtrados.filter((p) => !p.destaque) : filtrados;
  return <AppShell><main className="grid-noise"><section className="mx-auto max-w-[1400px] px-5 pb-16 pt-12 lg:px-8 lg:pb-24 lg:pt-20"><div className="grid items-end gap-10 lg:grid-cols-[1.1fr_.9fr]"><div className="animate-rise"><div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#ff665e]"><span className="h-px w-8 bg-[#ff534d]" /> Loja independente de software / 2026</div><h1 className="max-w-3xl font-display text-[clamp(3.2rem,8vw,7.6rem)] font-extrabold leading-[.91] tracking-[-.075em] text-white">CODEDARK<br /><span className="text-[#ff534d]">Software que</span><br />funciona nas sombras.</h1><p className="mt-8 max-w-xl text-base leading-7 text-[#909aaa]">Ferramentas para quem mantém sistemas funcionando depois que todo mundo já saiu. Downloads diretos, licenças claras, zero teatro.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#catalogo" className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] transition hover:bg-[#ff6c64]">Explorar ferramentas <ArrowRight size={16} /></a><Link href="/conta" className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-5 py-3 text-sm font-bold text-[#c5cdd8] transition hover:border-[#ff534d]/60 hover:text-white">Abrir biblioteca</Link></div></div><div className="relative animate-rise delay-2"><div className="absolute -inset-8 bg-[#ff3e36]/8 blur-[70px]" /><div className="relative border border-white/10 bg-[#151822]/90 p-4 shadow-2xl"><div className="flex items-center gap-2 border-b border-white/8 pb-3 text-[10px] text-[#687384]"><span className="h-2 w-2 rounded-full bg-[#ff534d]" /><span className="h-2 w-2 rounded-full bg-[#edaa4e]" /><span className="h-2 w-2 rounded-full bg-[#60b38e]" /><span className="ml-2 font-mono-ui">codedark / canal-de-lancamento</span></div><div className="p-5 font-mono-ui text-[12px] leading-7 text-[#7e899b]"><div><span className="text-[#ff625b]">cd</span> ~/enviar/sem-ruido</div><div><span className="text-[#ff625b]">code</span> --encontrar algo-util</div><div className="mt-4 text-[#c3cad4]"><span className="text-[#60b38e]">encontrado</span> 05 ferramentas no escuro</div><div className="mt-3 text-[#ff8c85]">→ pronto quando você estiver<span className="animate-pulse-soft">_</span></div></div></div><div className="mt-3 flex items-center justify-between border border-white/8 bg-[#131620] px-4 py-3 text-xs text-[#8994a6]"><span className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#60b38e]" /> Entrega verificada em cada ferramenta</span><span className="font-mono-ui text-[#5d697c]">CD//01</span></div></div></div></section><section className="border-y border-white/[.07] bg-[#12151e]"><div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-7 sm:grid-cols-3 lg:px-8"><Estatistica icone={<Zap size={17} />} titulo="Entrega imediata" texto="O link aparece após a compra." /><Estatistica icone={<LockKeyhole size={17} />} titulo="Privado por padrão" texto="Sem rastreamento desnecessário." /><Estatistica icone={<Headphones size={17} />} titulo="Suporte humano" texto="Fale com um operador quando algo quebrar." /></div></section><section id="catalogo" className="mx-auto max-w-[1400px] px-5 py-16 lg:px-8 lg:py-24"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="mb-3 font-mono-ui text-[11px] uppercase tracking-[.2em] text-[#ff625b]">01 / catálogo</div><h2 className="font-display text-4xl font-extrabold tracking-[-.04em] text-white">Escolha sua próxima vantagem.</h2></div><div className="relative w-full lg:w-[310px]"><Search size={16} className="absolute left-3.5 top-3.5 text-[#697486]" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar ferramentas, tags..." className="w-full rounded-lg border border-white/10 bg-[#151822] py-3 pl-10 pr-4 text-sm text-white placeholder:text-[#5f6b7e] outline-none transition focus:border-[#ff534d]/70" data-testid="input-search-products" /></div></div><div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">{categorias.map((item) => <button key={item} onClick={() => setCategoria(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${categoria === item ? 'border-[#ff534d] bg-[#ff534d]/12 text-[#ff8b84]' : 'border-white/10 text-[#7f8a9c] hover:border-white/20 hover:text-white'}`}>{item}</button>)}</div>{destaques.length > 0 && categoria === categorias[0] && !busca && <div className="mt-10 grid gap-5 lg:grid-cols-2">{destaques.map((p) => <CartaoProduto key={p.id} produto={p} />)}</div>}<div className="mt-12 flex items-center justify-between border-b border-white/8 pb-4"><h3 className="font-display text-lg font-bold text-white">{categoria === categorias[0] ? 'Todos os lançamentos' : categoria}</h3><span className="font-mono-ui text-xs text-[#697486]">{lista.length.toString().padStart(2, '0')} produtos</span></div>{lista.length ? <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{lista.map((p, i) => <div key={p.id} className={`animate-rise delay-${Math.min(i + 1, 4)}`}><CartaoProduto produto={p} /></div>)}</div> : <EstadoVazio titulo="Nenhum sinal encontrado." texto="Tente uma busca mais ampla ou limpe o filtro." acao="Limpar filtros" onAcao={() => { setBusca(''); setCategoria(categorias[0]); }} />}</section><section className="mx-auto max-w-[1400px] px-5 pb-20 lg:px-8 lg:pb-28"><div className="relative overflow-hidden border border-[#ff534d]/25 bg-[#21171b] p-7 sm:p-10"><div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center"><div><div className="font-mono-ui text-[11px] uppercase tracking-[.2em] text-[#ff766e]">Nota do operador</div><h2 className="mt-3 max-w-2xl font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Nenhuma assinatura escondida.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#a99699]">Compre uma vez. Fique com a versão que baixou. Atualizações são anunciadas, nunca impostas.</p></div><Link href="/conta" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#ff8078] hover:text-white">Precisa de ajuda? Fale com o suporte <ArrowRight size={16} /></Link></div></div></section></main></AppShell>;
}

function Estatistica({ icone, titulo, texto }: { icone: ReactNode; titulo: string; texto: string }) {
  return <div className="flex gap-3"><div className="mt-0.5 text-[#ff625b]">{icone}</div><div><div className="text-sm font-bold text-[#dde3eb]">{titulo}</div><div className="mt-1 text-xs leading-5 text-[#707b8e]">{texto}</div></div></div>;
}

function useCatalogo() {
  const [produtos, setProdutos] = useState<Product[]>(() => memoria.ler('codedark-produtos', produtosIniciais));
  useEffect(() => memoria.salvar('codedark-produtos', produtos), [produtos]);
  return [produtos, setProdutos] as const;
}

function Produto() {
  const [, parametros] = useRoute('/produto/:id');
  const [produtos] = useCatalogo();
  const produto = produtos.find((p) => p.id === parametros?.id);
  const [, irPara] = useLocation();
  const [comprado, setComprado] = useState(() => produto ? memoria.ler<string[]>('codedark-biblioteca', []).includes(produto.id) : false);
  const [checkout, setCheckout] = useState(false);
  if (!produto) return <AppShell><div className="mx-auto max-w-[1100px] px-5 py-24 text-center"><Package className="mx-auto text-[#ff534d]" size={34} /><h1 className="mt-5 font-display text-3xl font-bold text-white">Essa ferramenta não está no arquivo.</h1><Link href="/" className="mt-6 inline-flex text-sm text-[#ff766e]">Voltar para a loja <ArrowRight size={15} /></Link></div></AppShell>;
  const concluir = (cupom?: Cupom) => {
    const biblioteca = memoria.ler<string[]>('codedark-biblioteca', []);
    if (!biblioteca.includes(produto.id)) memoria.salvar('codedark-biblioteca', [...biblioteca, produto.id]);
    if (cupom) memoria.salvar('codedark-cupons', memoria.ler<Cupom[]>('codedark-cupons', cuponsIniciais).map((c) => c.codigo === cupom.codigo ? { ...c, usos: c.usos + 1 } : c));
    setComprado(true);
    setCheckout(false);
  };
  return <AppShell><main className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8 lg:py-16"><button onClick={() => irPara('/')} className="mb-10 inline-flex items-center gap-2 text-xs font-semibold text-[#778396] transition hover:text-white"><ChevronLeft size={15} /> Voltar para a loja</button><div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16"><div><ArteProduto produto={produto} grande /><div className="mt-5 flex flex-wrap gap-2">{produto.tags.map((tag) => <span key={tag} className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-[#8994a6]">{tag}</span>)}</div></div><div className="flex flex-col justify-center"><div className="font-mono-ui text-[11px] uppercase tracking-[.2em] text-[#ff625b]">{produto.categoria} / v{produto.versao}</div><h1 className="mt-4 font-display text-5xl font-extrabold tracking-[-.055em] text-white sm:text-6xl">{produto.nome}</h1><p className="mt-4 text-lg leading-7 text-[#a1abba]">{produto.resumo}</p><div className="mt-5 flex items-center gap-4"><Avaliacao valor={produto.avaliacao} /><span className="text-xs text-[#657084]">{produto.downloads.toLocaleString('pt-BR')} instalações</span></div><p className="mt-8 text-sm leading-7 text-[#8590a2]">{produto.descricao}</p><div className="my-8 red-rule" /><div className="flex items-end justify-between"><div><div className="text-xs text-[#707b8e]">Licença única</div><div className="mt-1 font-mono-ui text-3xl font-medium text-white">R$ {produto.preco.toFixed(2).replace('.', ',')}</div>{produto.precoAntigo && <div className="text-xs text-[#5f6b7d]"><del>R$ {produto.precoAntigo.toFixed(2).replace('.', ',')}</del> <span className="text-[#60b38e]">economize R$ {(produto.precoAntigo - produto.preco).toFixed(2).replace('.', ',')}</span></div>}</div><div className="text-right text-xs text-[#768195]"><div className="flex items-center justify-end gap-1.5"><Download size={13} /> {produto.entrega}</div><div className="mt-1">Versão {produto.versao}</div></div></div><Botao className="mt-7 w-full py-3.5" onClick={() => comprado ? undefined : setCheckout(true)}>{comprado ? <><Check size={17} /> Na sua biblioteca</> : <><ShoppingBag size={17} /> Adquirir {produto.nome}</>}</Botao>{comprado && <a href={produto.linkDownload} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#ff817a] hover:text-white"><Download size={15} /> Baixar sua cópia <ExternalLink size={13} /></a>}<div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#657084]"><LockKeyhole size={13} /> Checkout seguro · Licença entregue na hora</div></div></div><div className="mt-20 grid gap-5 border-t border-white/8 pt-10 sm:grid-cols-3"><Destaque icone={<FileCode2 size={18} />} titulo="Feito para sua stack" texto="Software pequeno e focado, que não atrapalha seu fluxo." /><Destaque icone={<BadgeCheck size={18} />} titulo="Licença clara" texto="Uma compra, termos simples, nenhuma surpresa recorrente." /><Destaque icone={<LifeBuoy size={18} />} titulo="Suporte incluído" texto="Fale com uma pessoa se sua configuração precisar de ajuda." /></div></main>{checkout && <Checkout produto={produto} onClose={() => setCheckout(false)} onConcluir={concluir} />}</AppShell>;
}

function Destaque({ icone, titulo, texto }: { icone: ReactNode; titulo: string; texto: string }) {
  return <div className="border border-white/8 bg-[#131620] p-5"><div className="text-[#ff625b]">{icone}</div><h3 className="mt-4 text-sm font-bold text-white">{titulo}</h3><p className="mt-2 text-xs leading-5 text-[#758094]">{texto}</p></div>;
}

function Checkout({ produto, onClose, onConcluir }: { produto: Product; onClose: () => void; onConcluir: (cupom?: Cupom) => void }) {
  const [codigo, setCodigo] = useState('');
  const [cupom, setCupom] = useState<Cupom>();
  const [erro, setErro] = useState('');
  const cupons = memoria.ler<Cupom[]>('codedark-cupons', cuponsIniciais);
  const validar = () => {
    const encontrado = cupons.find((c) => c.codigo === codigo.trim().toUpperCase() && c.ativo);
    if (!encontrado) { setErro('Cupom inválido ou expirado.'); setCupom(undefined); return; }
    setCupom(encontrado); setErro('');
  };
  const total = produto.preco * (1 - (cupom?.desconto || 0) / 100);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-sm"><div className="w-full max-w-lg border border-white/10 bg-[#151822] shadow-2xl"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#ff625b]">Checkout</div><h2 className="mt-1 font-display text-xl font-bold text-white">Finalizar aquisição</h2></div><button onClick={onClose} className="p-2 text-[#788498] hover:text-white"><X size={18} /></button></div><div className="space-y-5 p-5"><div className="flex items-center justify-between border border-white/8 bg-[#10131b] p-4"><div><div className="font-bold text-white">{produto.nome}</div><div className="mt-1 text-xs text-[#778396]">Licença perpétua · {produto.entrega}</div></div><div className="font-mono-ui font-medium text-white">R$ {produto.preco.toFixed(2).replace('.', ',')}</div></div><div><label className="mb-2 block text-xs font-semibold text-[#8994a6]">Cupom de desconto</label><div className="flex gap-2"><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="CÓDIGO" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm uppercase text-white outline-none focus:border-[#ff534d]" /><Botao variante="contorno" onClick={validar}>Aplicar</Botao></div>{erro && <p className="mt-2 text-xs text-red-300">{erro}</p>}{cupom && <p className="mt-2 text-xs text-[#70c69e]">Cupom aplicado: {cupom.desconto}% de desconto.</p>}</div><div className="flex items-center justify-between border-t border-white/8 pt-4"><span className="text-sm text-[#8d98aa]">Total</span><strong className="font-mono-ui text-2xl text-white">R$ {total.toFixed(2).replace('.', ',')}</strong></div><Botao className="w-full py-3.5" onClick={() => onConcluir(cupom)}><Check size={16} /> Confirmar compra demo</Botao><p className="text-center text-[11px] text-[#657084]">Modo demonstração: nenhum pagamento real será processado.</p></div></div></div>;
}

function Conta() {
  const [produtos] = useCatalogo();
  const ids = memoria.ler<string[]>('codedark-biblioteca', ['terminal-forge', 'pixel-inspector']);
  const biblioteca = produtos.filter((p) => ids.includes(p.id));
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => memoria.ler('codedark-mensagens', mensagensIniciais));
  const [rascunho, setRascunho] = useState('');
  const enviar = () => { if (!rascunho.trim()) return; const novas = [...mensagens, { id: `m-${Date.now()}`, remetente: 'cliente' as const, texto: rascunho.trim(), horario: 'agora' }]; setMensagens(novas); memoria.salvar('codedark-mensagens', novas); setRascunho(''); };
  return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8 lg:py-16"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="font-mono-ui text-[11px] uppercase tracking-[.2em] text-[#ff625b]">02 / espaço do cliente</div><h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-.05em] text-white">Minha biblioteca.</h1><p className="mt-3 text-sm text-[#8490a2]">Tudo o que você comprou em um só lugar.</p></div><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff756d] hover:text-white">Ver mais ferramentas <ArrowRight size={15} /></Link></div><div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]"><section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold text-white">Ferramentas adquiridas <span className="ml-2 font-mono-ui text-xs text-[#657084]">{biblioteca.length.toString().padStart(2, '0')}</span></h2><span className="text-xs text-[#657084]">Conta local de demonstração</span></div>{biblioteca.length ? <div className="space-y-3">{biblioteca.map((p) => <div key={p.id} className="flex flex-col gap-4 border border-white/9 bg-[#131620] p-4 sm:flex-row sm:items-center"><div className="w-full sm:w-[170px]"><ArteProduto produto={p} /></div><div className="min-w-0 flex-1"><h3 className="font-display font-bold text-white">{p.nome}</h3><p className="mt-1 text-sm text-[#788498]">{p.resumo}</p><div className="mt-3 flex gap-3 text-[11px] text-[#697486]"><span>Versão {p.versao}</span><span className="text-[#60b38e]">Licença ativa</span></div></div><a href={p.linkDownload} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#c7ced8] hover:border-[#ff534d]/50 hover:text-white"><Download size={14} /> Baixar</a></div>)}</div> : <EstadoVazio titulo="Sua biblioteca está vazia." texto="Escolha uma ferramenta na loja e ela aparecerá aqui." acao="Explorar catálogo" onAcao={() => window.location.assign(basePath || '/')} />}</section><Chat mensagens={mensagens} rascunho={rascunho} setRascunho={setRascunho} enviar={enviar} /></div><div className="mt-12 grid gap-4 sm:grid-cols-3"><InfoMini icone={<LockKeyhole size={17} />} titulo="Seus dados são seus" texto="Esta demonstração guarda a biblioteca no seu navegador." /><InfoMini icone={<Clipboard size={17} />} titulo="Precisa de nota fiscal?" texto="Envie uma mensagem e inclua o e-mail da compra." /><InfoMini icone={<CircleHelp size={17} />} titulo="Dúvida de configuração?" texto="Normalmente respondemos no mesmo dia útil." /></div></main></AppShell>;
}

function Chat({ mensagens, rascunho, setRascunho, enviar }: { mensagens: Mensagem[]; rascunho: string; setRascunho: (v: string) => void; enviar: () => void }) {
  return <section className="glass-panel flex min-h-[480px] flex-col border-white/9"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div className="flex items-center gap-3"><div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#ff534d]/12 text-[#ff766e]"><MessageSquare size={16} /><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#161923] bg-[#60b38e]" /></div><div><div className="text-sm font-bold text-white">Suporte CodeDark</div><div className="text-[11px] text-[#6f7b8d]">Geralmente responde no mesmo dia</div></div></div><MoreDots /></div><div className="flex-1 space-y-4 overflow-auto p-5">{mensagens.map((mensagem) => <div key={mensagem.id} className={`flex ${mensagem.remetente === 'cliente' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${mensagem.remetente === 'cliente' ? 'rounded-br-sm bg-[#ff534d] text-white' : 'rounded-bl-sm border border-white/8 bg-[#1b1f2a] text-[#c2c9d4]'}`}><div>{mensagem.texto}</div><div className={`mt-1 text-[10px] ${mensagem.remetente === 'cliente' ? 'text-white/60' : 'text-[#697486]'}`}>{mensagem.horario}</div></div></div>)}</div><div className="border-t border-white/8 p-4"><div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#10131b] p-1.5"><input value={rascunho} onChange={(e) => setRascunho(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()} placeholder="Escreva para o suporte..." className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-[#5f6b7d]" /><button onClick={enviar} className="rounded-md bg-[#ff534d] p-2 text-white transition hover:bg-[#ff6c64]"><Send size={15} /></button></div></div></section>;
}

function MoreDots() { return <Settings2 size={18} className="text-[#697486]" />; }
function InfoMini({ icone, titulo, texto }: { icone: ReactNode; titulo: string; texto: string }) { return <div className="border border-white/8 p-4"><div className="text-[#ff625b]">{icone}</div><div className="mt-3 text-sm font-bold text-[#d9dfe8]">{titulo}</div><div className="mt-1 text-xs leading-5 text-[#737f92]">{texto}</div></div>; }

function Admin() {
  const [produtos, setProdutos] = useCatalogo();
  const [cupons, setCupons] = useState<Cupom[]>(() => memoria.ler('codedark-cupons', cuponsIniciais));
  const [admin, setAdmin] = useState(() => memoria.ler<Usuario | null>('codedark-admin', null));
  const [secao, setSecao] = useState<'produtos' | 'cupons' | 'entregas' | 'mensagens'>('produtos');
  const [editando, setEditando] = useState<Product | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  useEffect(() => memoria.salvar('codedark-cupons', cupons), [cupons]);
  if (!admin) return <AppShell><AcessoAdmin onEntrar={() => { const novo = { nome: 'Administrador', email: 'admin@codedark.local', administrador: true }; memoria.salvar('codedark-admin', novo); setAdmin(novo); }} /></AppShell>;
  const excluir = (id: string) => { if (window.confirm('Remover este produto do catálogo?')) setProdutos(produtos.filter((p) => p.id !== id)); };
  return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8 lg:py-14"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="font-mono-ui text-[11px] uppercase tracking-[.2em] text-[#ff625b]">03 / console do operador</div><h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-.05em] text-white">Workspace da loja.</h1><p className="mt-3 text-sm text-[#8490a2]">Gerencie o que é enviado, como é enviado e quem recebe desconto.</p></div><Botao onClick={() => { setEditando(null); setFormAberto(true); }}><Plus size={16} /> Novo produto</Botao></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><AdminStat label="Produtos ativos" valor={produtos.length.toString().padStart(2, '0')} icone={<Boxes size={18} />} detalhe="+2 este mês" /><AdminStat label="Downloads totais" valor={produtos.reduce((a, p) => a + p.downloads, 0).toLocaleString('pt-BR')} icone={<Download size={18} />} detalhe="+18,4% no período" /><AdminStat label="Mensagens abertas" valor="03" icone={<MessageSquare size={18} />} detalhe="1 precisa de resposta" /></div><div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]"><aside className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">{[['produtos', <Package size={16} />, 'Produtos'], ['cupons', <Tag size={16} />, 'Cupons'], ['entregas', <FolderOpen size={16} />, 'Entregas'], ['mensagens', <MessageSquare size={16} />, 'Mensagens']].map(([id, icone, titulo]) => <button key={id as string} onClick={() => setSecao(id as typeof secao)} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition lg:w-full ${secao === id ? 'bg-[#ff534d]/12 text-[#ff847c]' : 'text-[#7c8799] hover:bg-white/[.04] hover:text-white'}`}>{icone}{titulo}</button>)}</aside><section>{secao === 'produtos' && <GerenciadorProdutos produtos={produtos} editar={(p) => { setEditando(p); setFormAberto(true); }} excluir={excluir} />}{secao === 'cupons' && <GerenciadorCupons cupons={cupons} setCupons={setCupons} />}{secao === 'entregas' && <GerenciadorEntregas produtos={produtos} setProdutos={setProdutos} />}{secao === 'mensagens' && <MensagensAdmin />}</section></div></main>{formAberto && <FormularioProduto inicial={editando} fechar={() => setFormAberto(false)} salvar={(produto) => { setProdutos(editando ? produtos.map((p) => p.id === produto.id ? produto : p) : [...produtos, produto]); setFormAberto(false); }} />}</AppShell>;
}

function AcessoAdmin({ onEntrar }: { onEntrar: () => void }) {
  return <main className="mx-auto flex min-h-[65vh] max-w-lg items-center px-5 py-16"><div className="w-full border border-white/10 bg-[#131620] p-8 text-center shadow-2xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff534d]/12 text-[#ff766e]"><ShieldCheck size={25} /></div><h1 className="mt-6 font-display text-3xl font-extrabold text-white">Acesso administrativo</h1><p className="mt-3 text-sm leading-6 text-[#8490a2]">O console de gestão é protegido. Entre com o administrador de demonstração para visualizar o CRUD da loja.</p><Botao className="mt-7 w-full" onClick={onEntrar}><LogIn size={16} /> Entrar como administrador</Botao></div></main>;
}

function AdminStat({ label, valor, detalhe, icone }: { label: string; valor: string; detalhe: string; icone: ReactNode }) { return <div className="border border-white/8 bg-[#131620] p-4"><div className="flex items-center justify-between text-[#ff625b]"><span className="text-xs text-[#7e899b]">{label}</span>{icone}</div><div className="mt-4 font-mono-ui text-2xl font-medium text-white">{valor}</div><div className="mt-1 text-[11px] text-[#60b38e]">{detalhe}</div></div>; }

function GerenciadorProdutos({ produtos, editar, excluir }: { produtos: Product[]; editar: (p: Product) => void; excluir: (id: string) => void }) {
  const [apenasDestaques, setApenasDestaques] = useState(false);
  const visiveis = apenasDestaques ? produtos.filter((p) => p.destaque) : produtos;
  return <div className="overflow-hidden border border-white/8 bg-[#131620]"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div><h2 className="font-display font-bold text-white">Inventário do catálogo</h2><p className="mt-1 text-xs text-[#707b8e]">{apenasDestaques ? 'Exibindo apenas os lançamentos em destaque.' : 'Todos os produtos visíveis e suas configurações.'}</p></div><button onClick={() => setApenasDestaques(!apenasDestaques)} className={`rounded-lg p-2 transition hover:bg-white/[.05] ${apenasDestaques ? 'text-[#ff766e]' : 'text-[#798497] hover:text-white'}`} title="Filtrar destaques"><Filter size={16} /></button></div><div className="divide-y divide-white/[.06]">{visiveis.map((p) => <div key={p.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"><div className="h-12 w-20 shrink-0"><ArteProduto produto={p} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-bold text-white">{p.nome}</h3>{p.destaque && <span className="rounded bg-[#ff534d]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#ff827a]">Destaque</span>}</div><p className="mt-1 truncate text-xs text-[#717d90]">{p.categoria} · v{p.versao} · {p.entrega}</p></div><div className="font-mono-ui text-sm text-[#d7dde5]">R$ {p.preco.toFixed(2).replace('.', ',')}</div><div className="flex gap-1"><button onClick={() => editar(p)} className="rounded-md p-2 text-[#778396] hover:bg-white/[.06] hover:text-white" title="Editar"><Pencil size={15} /></button><button onClick={() => excluir(p.id)} className="rounded-md p-2 text-[#778396] hover:bg-red-500/10 hover:text-red-300" title="Excluir"><Trash2 size={15} /></button></div></div>)}</div></div>;
}

function GerenciadorCupons({ cupons, setCupons }: { cupons: Cupom[]; setCupons: Dispatch<SetStateAction<Cupom[]>> }) {
  const [codigo, setCodigo] = useState('');
  const [desconto, setDesconto] = useState('10');
  const adicionar = () => { if (!codigo.trim()) return; setCupons([...cupons, { codigo: codigo.trim().toUpperCase(), desconto: Number(desconto) || 10, usos: 0, ativo: true }]); setCodigo(''); };
  return <div className="border border-white/8 bg-[#131620]"><div className="border-b border-white/8 px-5 py-4"><h2 className="font-display font-bold text-white">Cupons de desconto</h2><p className="mt-1 text-xs text-[#707b8e]">Ative uma oferta sem alterar o preço do produto.</p></div><div className="flex flex-col gap-2 border-b border-white/8 p-5 sm:flex-row"><input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="CÓDIGO" className="rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm uppercase text-white outline-none focus:border-[#ff534d]" /><input value={desconto} onChange={(e) => setDesconto(e.target.value)} type="number" min="1" max="90" className="w-28 rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff534d]" /><Botao onClick={adicionar}><Plus size={15} /> Adicionar cupom</Botao></div><div className="divide-y divide-white/[.06]">{cupons.map((cupom) => <div key={cupom.codigo} className="flex items-center gap-4 px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff534d]/10 text-[#ff756d]"><Tag size={16} /></div><div className="flex-1"><div className="font-mono-ui text-sm font-medium text-white">{cupom.codigo}</div><div className="mt-1 text-xs text-[#727e91]">{cupom.desconto}% de desconto · {cupom.usos} usos</div></div><button onClick={() => setCupons(cupons.map((item) => item.codigo === cupom.codigo ? { ...item, ativo: !item.ativo } : item))} className={`rounded-full px-3 py-1 text-[11px] font-bold ${cupom.ativo ? 'bg-[#60b38e]/12 text-[#70c69e]' : 'bg-white/[.06] text-[#697486]'}`}>{cupom.ativo ? 'Ativo' : 'Pausado'}</button><button onClick={() => setCupons(cupons.filter((item) => item.codigo !== cupom.codigo))} className="p-2 text-[#657084] hover:text-red-300" title="Excluir"><Trash2 size={15} /></button></div>)}</div></div>;
}

function GerenciadorEntregas({ produtos, setProdutos }: { produtos: Product[]; setProdutos: Dispatch<SetStateAction<Product[]>> }) { return <div className="border border-white/8 bg-[#131620]"><div className="border-b border-white/8 px-5 py-4"><h2 className="font-display font-bold text-white">Rotas de entrega</h2><p className="mt-1 text-xs text-[#707b8e]">Destino do cliente depois de uma compra concluída.</p></div><div className="divide-y divide-white/[.06]">{produtos.map((p) => <div key={p.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center"><div className="flex-1"><div className="text-sm font-bold text-white">{p.nome}</div><div className="mt-1 flex items-center gap-2 text-xs text-[#778396]"><ExternalLink size={12} className="text-[#ff625b]" /><span className="truncate">{p.linkDownload}</span></div></div><select value={p.entrega} onChange={(e) => setProdutos(produtos.map((item) => item.id === p.id ? { ...item, entrega: e.target.value as Product['entrega'] } : item))} className="rounded-lg border border-white/10 bg-[#10131b] px-3 py-2 text-xs text-[#cfd6e0] outline-none"><option>Download imediato</option><option>Chave de licença</option><option>Pacote de modelos</option></select><input value={p.linkDownload} onChange={(e) => setProdutos(produtos.map((item) => item.id === p.id ? { ...item, linkDownload: e.target.value } : item))} className="w-full rounded-lg border border-white/10 bg-[#10131b] px-3 py-2 text-xs text-[#9fa9b8] outline-none focus:border-[#ff534d] md:w-72" /></div>)}</div></div>; }

function MensagensAdmin() {
  const mensagens = memoria.ler<Mensagem[]>('codedark-mensagens', mensagensIniciais);
  return <div className="border border-white/8 bg-[#131620]"><div className="border-b border-white/8 px-5 py-4"><h2 className="font-display font-bold text-white">Central de suporte</h2><p className="mt-1 text-xs text-[#707b8e]">Mensagens recentes iniciadas pelos clientes.</p></div><div className="divide-y divide-white/[.06]">{mensagens.map((m) => <div key={m.id} className="flex gap-3 px-5 py-4"><div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${m.remetente === 'cliente' ? 'bg-[#ff534d]' : 'bg-[#60b38e]'}`} /><div><div className="text-sm text-white">{m.remetente === 'cliente' ? 'Cliente' : 'Suporte'} <span className="ml-2 text-[11px] text-[#657084]">{m.horario}</span></div><p className="mt-1 text-sm leading-6 text-[#8b96a8]">{m.texto}</p></div></div>)}</div></div>;
}

function FormularioProduto({ inicial, fechar, salvar }: { inicial: Product | null; fechar: () => void; salvar: (p: Product) => void }) {
  const [form, setForm] = useState<Product>(inicial || { id: '', nome: '', resumo: '', descricao: '', categoria: categorias[1], versao: '1.0.0', preco: 0, avaliacao: 4.8, downloads: 0, destaque: false, imagem: 'forge', entrega: 'Download imediato', linkDownload: '', tags: [] });
  const atualizar = <K extends keyof Product>(chave: K, valor: Product[K]) => setForm((atual) => ({ ...atual, [chave]: valor }));
  const confirmar = () => { if (!form.nome || !form.resumo || !form.preco || !form.linkDownload) return; salvar({ ...form, id: form.id || form.nome.toLowerCase().replaceAll(' ', '-').replace(/[^a-z0-9-]/g, '') }); };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92dvh] w-full max-w-2xl overflow-auto border border-white/10 bg-[#151822] shadow-2xl"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#ff625b]">Editor do catálogo</div><h2 className="mt-1 font-display text-xl font-bold text-white">{inicial ? 'Editar produto' : 'Novo produto'}</h2></div><button onClick={fechar} className="rounded-lg p-2 text-[#788498] hover:bg-white/[.05] hover:text-white"><X size={18} /></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><Campo label="Nome do produto" value={form.nome} onChange={(v) => atualizar('nome', v)} /><Campo label="Resumo curto" value={form.resumo} onChange={(v) => atualizar('resumo', v)} /><Campo label="Versão" value={form.versao} onChange={(v) => atualizar('versao', v)} /><Campo label="Preço" type="number" value={String(form.preco || '')} onChange={(v) => atualizar('preco', Number(v))} /><Campo label="Link de entrega" className="sm:col-span-2" value={form.linkDownload} onChange={(v) => atualizar('linkDownload', v)} /><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-[#8994a6]">Descrição completa</span><textarea value={form.descricao} onChange={(e) => atualizar('descricao', e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff534d]" /></label><label><span className="mb-1.5 block text-xs font-semibold text-[#8994a6]">Categoria</span><select value={form.categoria} onChange={(e) => atualizar('categoria', e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm text-white outline-none">{categorias.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-semibold text-[#8994a6]">Tipo de entrega</span><select value={form.entrega} onChange={(e) => atualizar('entrega', e.target.value as Product['entrega'])} className="w-full rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm text-white outline-none"><option>Download imediato</option><option>Chave de licença</option><option>Pacote de modelos</option></select></label><Campo label="Tags (separadas por vírgula)" value={form.tags.join(', ')} onChange={(v) => atualizar('tags', v.split(',').map((x) => x.trim()).filter(Boolean))} /><label className="flex items-center gap-3 self-end pb-2 text-sm text-[#aab4c3]"><input type="checkbox" checked={form.destaque} onChange={(e) => atualizar('destaque', e.target.checked)} className="h-4 w-4 accent-[#ff534d]" /> Exibir em destaque</label></div><div className="flex justify-end gap-2 border-t border-white/8 px-5 py-4"><Botao variante="fantasma" onClick={fechar}>Cancelar</Botao><Botao onClick={confirmar}><Check size={15} /> Salvar produto</Botao></div></div></div>;
}

function Campo({ label, value, onChange, type = 'text', className = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return <label className={className}><span className="mb-1.5 block text-xs font-semibold text-[#8994a6]">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#10131b] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff534d]" /></label>;
}

function EstadoVazio({ titulo, texto, acao, onAcao }: { titulo: string; texto: string; acao: string; onAcao: () => void }) {
  return <div className="border border-dashed border-white/12 py-16 text-center"><Search className="mx-auto text-[#ff625b]" size={23} /><h3 className="mt-4 font-display font-bold text-white">{titulo}</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[#707b8e]">{texto}</p><Botao variante="contorno" className="mt-5" onClick={onAcao}>{acao}</Botao></div>;
}

function Acesso({ modo }: { modo: 'entrar' | 'cadastrar' }) {
  const [, irPara] = useLocation();
  const [enviado, setEnviado] = useState(false);
  const enviar = (evento: FormEvent<HTMLFormElement>) => { evento.preventDefault(); const usuario = { nome: modo === 'entrar' ? 'Operador' : 'Novo operador', email: 'demo@codedark.local', administrador: false }; memoria.salvar('codedark-usuario', usuario); setEnviado(true); };
  return <div className="grid min-h-[100dvh] place-items-center bg-[#0a0b0f] px-4 py-8"><div className="absolute left-6 top-6"><Logo /></div><div className="w-full max-w-[460px] border border-white/10 bg-[#151822] p-7 shadow-2xl sm:p-9"><div className="mb-8"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff534d]/12 text-[#ff766e]"><LockKeyhole size={19} /></div><h1 className="font-display text-2xl font-bold text-white">{modo === 'entrar' ? 'Bem-vindo de volta.' : 'Crie sua conta de operador.'}</h1><p className="mt-2 text-sm leading-6 text-[#8490a2]">{modo === 'entrar' ? 'Entre para acessar sua biblioteca e licenças.' : 'Guarde suas compras e concentre o suporte em um só lugar.'}</p></div>{enviado ? <div className="border border-[#60b38e]/25 bg-[#60b38e]/8 p-4 text-sm leading-6 text-[#91d4b0]">Acesso criado. Você já pode abrir sua biblioteca.</div> : <form onSubmit={enviar} className="space-y-4"><input type="email" placeholder="E-mail" required className="w-full rounded-lg border border-white/10 bg-[#10131b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#5f6b7d] focus:border-[#ff534d]" /><input type="password" placeholder="Senha" required className="w-full rounded-lg border border-white/10 bg-[#10131b] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#5f6b7d] focus:border-[#ff534d]" /><Botao className="w-full py-3" type="submit">{modo === 'entrar' ? 'Entrar' : 'Criar conta'} <ArrowRight size={15} /></Botao></form>}<div className="mt-7 text-center text-xs text-[#738096]">{modo === 'entrar' ? <>Ainda não tem conta? <Link href="/cadastrar" className="font-semibold text-[#ff817a]">Criar uma conta</Link></> : <>Já possui uma conta? <Link href="/entrar" className="font-semibold text-[#ff817a]">Entrar</Link></>}</div>{enviado && <Botao variante="fantasma" className="mt-5 w-full" onClick={() => irPara('/conta')}>Abrir minha biblioteca</Botao>}</div></div>;
}

function Rotas() {
  return <ErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/produto/:id" component={Produto} /><Route path="/conta" component={Conta} /><Route path="/admin" component={Admin} /><Route path="/entrar" component={() => <Acesso modo="entrar" />} /><Route path="/cadastrar" component={() => <Acesso modo="cadastrar" />} /><Route component={() => <AppShell><div className="mx-auto max-w-3xl px-5 py-24 text-center"><h1 className="font-display text-4xl font-bold text-white">Página não encontrada.</h1><Link href="/" className="mt-6 inline-flex text-sm text-[#ff766e]">Voltar para a loja</Link></div></AppShell>} /></Switch></ErrorBoundary>;
}

export default function App() {
  return <WouterRouter base={basePath}><Rotas /></WouterRouter>;
}