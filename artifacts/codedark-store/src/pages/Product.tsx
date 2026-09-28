import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ArrowLeft, Check, Download, ExternalLink, Headphones, LockKeyhole, MessageSquare, Package, Zap } from 'lucide-react';
import { AppShell, ArteProduto, Botao } from '@/components/store';
import { get, moeda, post, type Order, type Product } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function PaginaProduto() {
  const [match, params] = useRoute<{ id: string }>('/produto/:id');
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [produto, setProduto] = useState<Product | null>(null);
  const [erro, setErro] = useState('');
  const [comprando, setComprando] = useState(false);
  const [pedidos, setPedidos] = useState<Order[]>([]);

  useEffect(() => {
    if (match && params) get<Product>(`/products/${params.id}`).then(setProduto).catch((e: Error) => setErro(e.message));
  }, [match, params]);

  useEffect(() => {
    if (usuario) get<Order[]>('/orders').then(setPedidos).catch(() => {});
  }, [usuario]);

  if (!match) return null;
  if (erro) return <AppShell><div className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-[#ff6b63]">{erro}</p><Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-[#97a2b4] hover:text-white"><ArrowLeft size={15} /> Voltar para a loja</Link></div></AppShell>;
  if (!produto) return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><div className="aspect-[1.9] animate-pulse rounded-2xl border border-white/5 bg-white/[.03]" /></div></AppShell>;

  const gratis = produto.price_cents === 0;
  const pedidoPago = pedidos.find((o) => o.product_id === produto.id && o.status === 'pago');
  const pedidoPendente = pedidos.find((o) => o.product_id === produto.id && o.status === 'pendente');

  async function comprar() {
    if (!produto) return;
    setComprando(true);
    try {
      const r = await post<{ orderId: string; initPoint: string }>('/checkout', { productId: produto.id });
      window.location.href = r.initPoint;
    } catch (e) {
      setErro((e as Error).message);
      setComprando(false);
    }
  }

  return <AppShell>
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-8 lg:px-8 lg:pt-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#97a2b4] transition hover:text-white"><ArrowLeft size={15} /> Voltar</Link>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="animate-rise"><ArteProduto produto={produto} grande /></div>
        <div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#8b96a8]">
            <span className="rounded border border-white/10 bg-white/[.04] px-2.5 py-1">{produto.category || 'Sem categoria'}</span>
            {produto.featured && <span className="flex items-center gap-1.5 text-[#ffb454]"><Zap size={12} /> Em destaque</span>}
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-white lg:text-5xl">{produto.name}</h1>
          <p className="mt-3 text-base leading-7 text-[#9aa6b7]">{produto.summary}</p>

          <div className="mt-6 flex items-baseline gap-3">
            {gratis
              ? <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 font-display text-lg font-extrabold text-emerald-300">Grátis</span>
              : <><span className="font-display text-4xl font-extrabold text-white">{moeda(produto.price_cents)}</span>
                  {produto.old_price_cents && <del className="text-lg text-[#596373]">{moeda(produto.old_price_cents)}</del>}</>}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {pedidoPago ? (<>
              {produto.download_url && <a href={produto.download_url} className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] hover:bg-[#ff6c64]"><Download size={16} /> Baixar</a>}
              <Link href={`/pedido?o=${pedidoPago.id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[.03] px-5 py-3 text-sm font-semibold text-[#e9edf2] hover:border-[#ff534d]/60 hover:text-white"><MessageSquare size={15} /> Chat do pedido</Link>
            </>) : gratis ? (
              produto.download_url
                ? <a href={produto.download_url} className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] hover:bg-[#ff6c64]"><Download size={16} /> Baixar agora</a>
                : <span className="text-sm text-[#7f8b9d]">O download será liberado em breve.</span>
            ) : carregandoAuth ? <div className="h-[46px] w-48 animate-pulse rounded-lg bg-white/[.05]" /> : usuario ? (
              <Botao onClick={comprar} disabled={comprando || Boolean(pedidoPendente)}>
                {pedidoPendente ? 'Você já tem um pedido aberto' : comprando ? 'Redirecionando…' : 'Comprar no Mercado Pago'}
              </Botao>
            ) : (
              <Link href={`/entrar?next=/produto/${produto.id}`} className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] hover:bg-[#ff6c64]"><LockKeyhole size={15} /> Entrar para comprar</Link>
            )}
          </div>
          {pedidoPendente && <Link href={`/pedido?o=${pedidoPendente.id}`} className="mt-3 inline-flex items-center gap-2 text-sm text-[#ffb454] hover:text-white">Ver status do pedido →</Link>}

          <div className="mt-10 grid gap-3 border-t border-white/[.08] pt-8 text-sm text-[#8f99aa]">
            <div className="flex items-center gap-3"><Package size={15} className="text-[#ff625b]" /> {produto.delivery}</div>
            <div className="flex items-center gap-3"><Check size={15} className="text-emerald-400" /> Versão {produto.version}</div>
            <div className="flex items-center gap-3"><Headphones size={15} className="text-[#ff625b]" /> Chat de suporte liberado após a compra</div>
            {produto.video && <a href={produto.video} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#97a2b4] hover:text-white"><ExternalLink size={15} /> Assistir demonstração</a>}
          </div>
        </div>
      </div>

      {produto.description && (<>
        <div className="mb-4 mt-16 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#8b96a8]"><span className="h-px w-8 bg-white/20" /> Sobre este software</div>
        <div className="max-w-3xl whitespace-pre-line text-[15px] leading-8 text-[#a5b0c0]">{produto.description}</div>
      </>)}
    </main>
  </AppShell>;
}
