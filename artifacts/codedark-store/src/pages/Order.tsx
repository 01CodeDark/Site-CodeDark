import { useCallback, useEffect, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { ArrowLeft, Clock, Download, ShieldCheck } from 'lucide-react';
import { AppShell, ArteProduto, Botao, StatusChip, Vazio } from '@/components/store';
import { ChatPainel } from '@/components/chat';
import { get, moeda, post, type Mensagem, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function PaginaPedido() {
  const busca = useSearch();
  const orderId = new URLSearchParams(busca || '').get('o') || '';
  const paymentId = new URLSearchParams(busca || '').get('payment_id') || new URLSearchParams(busca || '').get('collection_id') || '';
  const { usuario, carregando } = useAuth();
  const [pedido, setPedido] = useState<Order | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (tentarConfirmar: boolean) => {
    if (!orderId) return;
    try {
      if (tentarConfirmar && paymentId) {
        await post(`/orders/${orderId}/verify`, { paymentId });
      } else {
        const r = await get<Order & { messages: Mensagem[] }>(`/orders/${orderId}${paymentId ? `?payment_id=${paymentId}` : ''}`);
        if (r.status === 'pendente' && r.mp_payment_id) {
          await post(`/orders/${orderId}/verify`, { paymentId: r.mp_payment_id });
        }
        setPedido(r);
        return;
      }
      const r = await get<Order & { messages: Mensagem[] }>(`/orders/${orderId}`);
      setPedido(r);
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [orderId, paymentId]);

  useEffect(() => {
    if (!carregando) void carregar(Boolean(paymentId));
  }, [carregando, carregar, paymentId]);

  // enquanto pendente, verifica o pagamento periodicamente
  useEffect(() => {
    if (pedido?.status !== 'pendente') return;
    const t = setInterval(() => { void carregar(true); }, 6000);
    return () => clearInterval(t);
  }, [pedido?.status, carregar]);

  if (!carregando && !usuario) return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><Vazio icone={<ShieldCheck size={26} />} titulo="Entre para ver este pedido" texto="Os pedidos ficam vinculados à sua conta."><Link href={`/entrar?next=/pedido?o=${orderId}`} className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white hover:bg-[#ff6c64]">Entrar</Link></Vazio></main></AppShell>;
  if (erro) return <AppShell><main className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-[#ff6b63]">{erro}</p><Link href="/conta" className="mt-6 inline-flex items-center gap-2 text-sm text-[#97a2b4] hover:text-white"><ArrowLeft size={15} /> Minha biblioteca</Link></main></AppShell>;
  if (!pedido) return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><div className="h-64 animate-pulse rounded-2xl bg-white/[.03]" /></main></AppShell>;

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

          {pedido.status === 'pago' && (<>
            <div className="mt-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.06] p-5">
              <p className="text-sm font-semibold text-emerald-300">Pagamento confirmado — download liberado</p>
              {pedido.download_url
                ? <a href={pedido.download_url} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,83,77,.24)] hover:bg-[#ff6c64]"><Download size={16} /> Baixar agora</a>
                : <p className="mt-3 text-xs text-[#a5b0c0]">O arquivo deste produto está sendo anexado. Use o chat ao lado que o suporte resolve rapidinho.</p>}
            </div>
            <div className="mt-8 lg:hidden"><ChatPainel orderId={pedido.id} /></div>
          </>)}
          {pedido.status === 'pendente' && (<>
            <div className="mt-7 rounded-2xl border border-amber-500/20 bg-amber-500/[.06] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-300"><Clock size={15} /> Aguardando confirmação do pagamento</p>
              <p className="mt-2 text-xs leading-5 text-[#a5b0c0]">Se você já pagou no Mercado Pago, esta página atualiza sozinha em instantes. Se fechou o checkout antes de pagar, repita a compra na página do produto.</p>
            </div>
            <Botao variante="contorno" className="mt-5" onClick={() => void carregar(true)}>Já paguei — verificar agora</Botao>
          </>)}
          {pedido.status === 'cancelado' && (
            <div className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-5">
              <p className="text-sm font-semibold text-red-300">Pedido cancelado</p>
              <p className="mt-2 text-xs text-[#a5b0c0]">O pagamento não foi concluído. Você pode tentar de novo na página do produto.</p>
            </div>
          )}
        </div>
        {pedido.status === 'pago' && <div className="hidden lg:block"><ChatPainel orderId={pedido.id} /></div>}
      </div>
    </main>
  </AppShell>;
}
