import { useCallback, useEffect, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { ArrowLeft, Copy, Download, MessageSquare, ShieldCheck } from 'lucide-react';
import { AppShell, ArteProduto, Botao, StatusChip, Vazio } from '@/components/store';
import { ChatPainel } from '@/components/chat';
import { get, moeda, type PagamentoInfo, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function PaginaPedido() {
  const busca = useSearch();
  const orderId = new URLSearchParams(busca || '').get('o') || '';
  const { usuario, carregando } = useAuth();
  const [pedido, setPedido] = useState<Order | null>(null);
  const [pix, setPix] = useState<PagamentoInfo | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!orderId) return;
    try {
      const r = await get<Order>(`/orders/${orderId}`);
      setPedido(r);
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [orderId]);

  useEffect(() => {
    if (!carregando) void carregar();
  }, [carregando, carregar]);

  // enquanto aguarda o PIX, a página se atualiza sozinha (quando o dono liberar)
  useEffect(() => {
    if (pedido?.status !== 'pendente') return;
    const t = setInterval(() => { void carregar(); }, 8000);
    return () => clearInterval(t);
  }, [pedido?.status, carregar]);

  useEffect(() => {
    if (pedido?.status === 'pendente') void get<PagamentoInfo>('/payment-info').then(setPix).catch(() => {});
  }, [pedido?.status]);

  if (!carregando && !usuario) return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><Vazio icone={<ShieldCheck size={26} />} titulo="Entre para ver este pedido" texto="Os pedidos ficam vinculados à sua conta."><Link href={`/entrar?next=/pedido?o=${orderId}`} className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white hover:bg-[#ff6c64]">Entrar</Link></Vazio></main></AppShell>;
  if (erro) return <AppShell><main className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-[#ff6b63]">{erro}</p><Link href="/conta" className="mt-6 inline-flex items-center gap-2 text-sm text-[#97a2b4] hover:text-white"><ArrowLeft size={15} /> Minha biblioteca</Link></main></AppShell>;
  if (!pedido) return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><div className="h-64 animate-pulse rounded-2xl bg-white/[.03]" /></main></AppShell>;

  function copiarPix() {
    navigator.clipboard?.writeText(pix?.pix_key || '');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return <AppShell>
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-10 lg:px-8 lg:pt-14">
      <Link href="/conta" className="mb-8 inline-flex items-center gap-2 text-sm text-[#97a2b4] transition hover:text-white"><ArrowLeft size={15} /> Minha biblioteca</Link>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">{pedido.product_name}</h1>
            <StatusChip status={pedido.status} />
          </div>
          <ArteProduto produto={{ art: pedido.art, photo: pedido.photo, name: pedido.product_name, version: pedido.version, category: '' }} grande />
          <div className="mt-6 grid gap-2.5 text-sm text-[#8f99aa]">
            <p className="font-mono-ui text-xs text-[#657084]">Pedido #{pedido.id.slice(0, 8)} · {moeda(pedido.amount_cents)} · {new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
            <p className="flex items-center gap-2">{pedido.delivery}</p>
          </div>

          {pedido.status === 'pendente' && (
            <div className="mt-7 rounded-2xl border border-amber-500/20 bg-amber-500/[.06] p-6">
              <p className="text-sm font-semibold text-amber-300">Pagamento via PIX — {moeda(pedido.amount_cents)}</p>
              {pix?.pix_key ? (<>
                <p className="mt-3 text-xs text-[#a5b0c0]">Chave PIX {pix.pix_holder ? `de ${pix.pix_holder}` : ''}:</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="flex-1 overflow-x-auto rounded-lg border border-white/10 bg-[#0a0e15] px-3.5 py-3 font-mono-ui text-sm text-[#e9edf2]">{pix.pix_key}</code>
                  <Botao variante="contorno" onClick={copiarPix} className="!py-3"><Copy size={14} /> {copiado ? 'Copiado!' : 'Copiar'}</Botao>
                </div>
                {pix.pix_note && <p className="mt-2 text-xs text-[#a5b0c0]">{pix.pix_note}</p>}
                <ol className="mt-4 grid list-decimal gap-1.5 pl-5 text-xs leading-6 text-[#a5b0c0]">
                  <li>Pague o valor exato <span className="font-semibold text-white">{moeda(pedido.amount_cents)}</span> na chave acima</li>
                  <li>Avise no chat ao lado (pode colar o comprovante)</li>
                  <li>Assim que o pagamento for conferido, o download libera aqui mesmo</li>
                </ol>
              </>) : (
                <p className="mt-3 text-xs leading-6 text-[#a5b0c0]">A chave PIX desta loja está sendo configurada. Use o chat ao lado para combinar o pagamento com o vendedor.</p>
              )}
            </div>
          )}
          {pedido.status === 'pago' && (
            <div className="mt-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.06] p-6">
              <p className="text-sm font-semibold text-emerald-300">Pagamento confirmado — download liberado</p>
              {pedido.download_url
                ? <a href={pedido.download_url} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] hover:bg-[#ff6c64]"><Download size={16} /> Baixar agora</a>
                : <p className="mt-3 text-xs text-[#a5b0c0]">O arquivo deste produto está sendo anexado. Use o chat ao lado que o suporte resolve rapidinho.</p>}
            </div>
          )}
          {pedido.status === 'cancelado' && (
            <div className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-5">
              <p className="text-sm font-semibold text-red-300">Pedido cancelado</p>
              <p className="mt-2 text-xs text-[#a5b0c0]">Esta compra não foi concluída. Você pode tentar de novo na página do produto.</p>
            </div>
          )}

          <div className="mt-8 lg:hidden"><ChatPainel orderId={pedido.id} /></div>
        </div>
        <div className="hidden lg:block"><ChatPainel orderId={pedido.id} /></div>
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-[#5f6b7f]"><MessageSquare size={13} /> Este chat é o canal direto com o suporte da loja para este pedido.</p>
    </main>
  </AppShell>;
}
