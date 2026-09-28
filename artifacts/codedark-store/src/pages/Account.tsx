import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Download, MessageSquare, Package } from 'lucide-react';
import { AppShell, ArteProduto, Botao, StatusChip, Vazio } from '@/components/store';
import { get, moeda, type Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Conta() {
  const { usuario, carregando } = useAuth();
  const [pedidos, setPedidos] = useState<Order[] | null>(null);

  useEffect(() => {
    if (usuario) get<Order[]>('/orders').then(setPedidos).catch(() => setPedidos([]));
  }, [usuario]);

  if (carregando) return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><div className="h-40 animate-pulse rounded-2xl bg-white/[.03]" /></div></AppShell>;
  if (!usuario) return <AppShell>
    <main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><Vazio icone={<Package size={26} />} titulo="Entre para ver sua biblioteca" texto="Suas compras, downloads e chats de suporte ficam guardados na sua conta."><Link href="/entrar?next=/conta" className="inline-flex items-center gap-2 rounded-lg bg-[#ff534d] px-5 py-3 text-sm font-bold text-white hover:bg-[#ff6c64]">Entrar</Link></Vazio></main>
  </AppShell>;

  return <AppShell>
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-10 lg:px-8 lg:pt-14">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#97a2b4] transition hover:text-white"><ArrowLeft size={15} /> Voltar</Link>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">Minha biblioteca</h1>
      <p className="mt-2 text-sm text-[#7f8b9d]">Pedidos, downloads e o chat de suporte de cada compra.</p>

      <div className="mt-10">
        {pedidos === null ? (
          <div className="grid gap-4">{[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[.03]" />)}</div>
        ) : pedidos.length === 0 ? (
          <Vazio icone={<Package size={26} />} titulo="Nenhuma compra ainda" texto="Quando você comprar um software, ele aparece aqui com o download e o chat de suporte.">
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[.03] px-5 py-3 text-sm font-semibold text-[#e9edf2] hover:border-[#ff534d]/60 hover:text-white">Ver catálogo</Link>
          </Vazio>
        ) : (
          <div className="grid gap-4">
            {pedidos.map((o) => (
              <div key={o.id} className="grid items-center gap-5 rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:grid-cols-[120px_1fr_auto]">
                <div className="w-[120px]"><ArteProduto produto={{ art: o.art, photo: o.photo, name: o.product_name, version: o.version, category: '' }} /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-lg font-bold text-white">{o.product_name}</h3>
                    <StatusChip status={o.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#7f8b9d]">{o.product_summary}</p>
                  <p className="mt-2 font-mono-ui text-xs text-[#657084]">{moeda(o.amount_cents)} · {new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  {o.status === 'pago' && o.download_url && <a href={o.download_url} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff534d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#ff6c64]"><Download size={15} /> Baixar</a>}
                  <Link href={`/pedido?o=${o.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[.03] px-4 py-2.5 text-sm font-semibold text-[#e9edf2] hover:border-[#ff534d]/60 hover:text-white"><MessageSquare size={15} /> {o.status === 'pago' ? 'Chat do pedido' : 'Ver pedido'}</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  </AppShell>;
}
