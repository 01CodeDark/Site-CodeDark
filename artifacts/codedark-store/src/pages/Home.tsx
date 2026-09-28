import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Boxes, Download, Search, Star } from 'lucide-react';
import { AppShell, ArteProduto, Botao, Chip, Vazio } from '@/components/store';
import { get, moeda, type Categoria, type Product } from '@/lib/api';

export default function Home() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      get<Product[]>('/products').catch(() => [] as Product[]),
      get<Categoria[]>('/categories').catch(() => [] as Categoria[]),
    ]).then(([ps, cs]) => { if (vivo) { setProdutos(ps); setCategorias(cs); setCarregando(false); } });
    return () => { vivo = false; };
  }, []);

  const filtrados = useMemo(() => produtos.filter((p) =>
    (!categoria || p.category_id === categoria) &&
    `${p.name} ${p.summary} ${p.tags.join(' ')}`.toLowerCase().includes(busca.toLowerCase()),
  ), [produtos, busca, categoria]);

  const destaques = produtos.filter((p) => p.featured);
  const catalogo = filtrados.filter((p) => !p.featured || busca || categoria);

  return <AppShell>
    <main className="grid-noise">
      <section className="mx-auto max-w-[1400px] px-5 pb-14 pt-10 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="animate-rise">
            <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#ff665e]">
              <span className="h-px w-8 bg-[#ff534d]" /> Loja de software / 2026
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(3rem,7vw,6.8rem)] font-extrabold leading-[.91] tracking-[-.075em] text-white">
              CODEDARK<br /><span className="text-[#ff534d]">Software</span><br />que funciona.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#9aa6b7]">
              Apps, jogos, ferramentas e utilitários publicados com um objetivo: você baixa e usa.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#catalogo" className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] hover:bg-[#ff6c64]">Ver catálogo <ArrowRight size={16} /></a>
              {destaques[0] && <Link href={`/produto/${destaques[0].id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[.03] px-5 py-3 text-sm font-semibold text-[#e9edf2] hover:border-[#ff534d]/60 hover:text-white"><Star size={15} className="text-[#ffb454]" /> Destaque: {destaques[0].name}</Link>}
            </div>
          </div>
          <div className="relative hidden lg:block">
            {destaques[0]
              ? <Link href={`/produto/${destaques[0].id}`}><ArteProduto produto={destaques[0]} grande /></Link>
              : <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[.02] text-center"><div><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[.03] text-[#ff625b]"><Boxes size={30} /></div><p className="mt-4 font-mono-ui text-xs text-[#5f6b7f]">aguardando publicação</p></div></div>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-24 lg:px-8">
        <div className="flex flex-col gap-4 border-t border-white/[.08] pt-8 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6b7f]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar software, jogo, utilitário…"
              className="w-full rounded-lg border border-white/10 bg-[#0a0e15] py-2.5 pl-11 pr-4 text-sm text-[#e9edf2] outline-none transition placeholder:text-[#59637a] focus:border-[#ff534d]/60 focus:ring-2 focus:ring-[#ff534d]/15"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip ativo={categoria === ''} onClick={() => setCategoria('')}>Todos</Chip>
            {categorias.map((c) => <Chip key={c.id} ativo={categoria === c.id} onClick={() => setCategoria(c.id === categoria ? '' : c.id)}>{c.name}</Chip>)}
          </div>
        </div>

        {destaques.length > 1 && !busca && !categoria && (<>
          <div className="mb-5 mt-12 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#ff665e]"><span className="h-px w-8 bg-[#ff534d]" /> Em destaque</div>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{destaques.slice(0, 4).map((p) => <CartaoProduto key={p.id} produto={p} />)}</div>
          <div className="mb-5 mt-14 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#8b96a8]"><span className="h-px w-8 bg-white/20" id="catalogo" /> Catálogo</div>
        </>)}

        <div id="catalogo" className="scroll-mt-24" />
        {carregando ? (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[1.55] animate-pulse rounded-xl border border-white/5 bg-white/[.03]" />)}</div>
        ) : catalogo.length === 0 ? (
          <div className="mt-12"><Vazio icone={<Boxes size={26} />} titulo={produtos.length ? 'Nada encontrado' : 'Catálogo vazio por aqui'} texto={produtos.length ? 'Nenhum software corresponde a essa busca. Tente outro termo ou categoria.' : 'Ainda não há nada publicado. Assim que um software entrar no catálogo, ele aparece aqui.'} /></div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{catalogo.map((p) => <CartaoProduto key={p.id} produto={p} />)}</div>
        )}
      </section>
    </main>
  </AppShell>;
}

export function CartaoProduto({ produto }: { produto: Product }) {
  const gratis = produto.price_cents === 0;
  return <Link href={`/produto/${produto.id}`} className="group block">
    <ArteProduto produto={produto} />
    <div className="pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[16px] font-bold text-white group-hover:text-[#ff6b63]">{produto.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#7f8b9d]">{produto.summary}</p>
        </div>
        <div className="pt-0.5 text-right">
          {gratis
            ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300"><Download size={11} /> Grátis</span>
            : <><span className="font-mono-ui text-sm font-medium text-white">{moeda(produto.price_cents)}</span>
                {produto.old_price_cents && <del className="block text-[11px] text-[#596373]">{moeda(produto.old_price_cents)}</del>}</>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#657084]">
        <span className="rounded border border-white/10 bg-white/[.04] px-2 py-0.5">{produto.category || 'Sem categoria'}</span>
        <span className="flex gap-1.5">{produto.tags.slice(0, 3).map((t) => <span key={t} className="rounded border border-white/10 bg-black/30 px-2 py-0.5 font-mono-ui">{t}</span>)}</span>
      </div>
    </div>
  </Link>;
}
