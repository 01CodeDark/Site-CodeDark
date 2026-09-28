import { useCallback, useEffect, useState } from 'react';
import { Boxes, MessageSquare, Package, Pencil, Plus, ShieldCheck, Star, Tag, Trash2, Upload, Users, X } from 'lucide-react';
import { AppShell, Botao, Campo, StatusChip, Vazio } from '@/components/store';
import { ChatPainel } from '@/components/chat';
import {
  centavosParaReais, del, ehAdmin, get, moeda, patch, post, reaisParaCentavos, rotuloPapel,
  type Categoria, type Order, type Product, type TeamOrder, type Usuario,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

const ENTREGAS = ['Download imediato', 'Chave de licença', 'Pacote de modelos'];
const ARTES = ['forge', 'pixel', 'vault', 'regex', 'notes'];

type FormProduto = {
  id?: string;
  name: string; summary: string; description: string; category_id: string;
  version: string; preco: string; precoAntigo: string; delivery: string;
  art: string; photo: string; video: string; download_url: string; tags: string;
  published: boolean; featured: boolean;
};

const formVazio: FormProduto = {
  name: '', summary: '', description: '', category_id: '', version: '1.0.0',
  preco: '', precoAntigo: '', delivery: ENTREGAS[0], art: 'forge', photo: '',
  video: '', download_url: '', tags: '', published: false, featured: false,
};

export default function Admin() {
  const { usuario, carregando } = useAuth();
  const [aba, setAba] = useState<'produtos' | 'categorias' | 'pedidos' | 'equipe'>('produtos');
  const admin = ehAdmin(usuario);

  useEffect(() => {
    if (usuario && !admin) setAba('pedidos');
  }, [usuario, admin]);

  if (carregando) return <AppShell><main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><div className="h-40 animate-pulse rounded-2xl bg-white/[.03]" /></main></AppShell>;
  if (!usuario || !(usuario.role === 'administrador' || usuario.role === 'moderador')) return <AppShell>
    <main className="mx-auto max-w-[1400px] px-5 py-24 lg:px-8"><Vazio icone={<ShieldCheck size={26} />} titulo="Painel protegido" texto="Esta área é exclusiva da equipe da loja. Se você é o dono, entre com sua conta de administrador." /></main>
  </AppShell>;

  return <AppShell>
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-10 lg:px-8 lg:pt-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">Painel</h1>
          <p className="mt-1 text-sm text-[#7f8b9d]">{usuario.name} · {rotuloPapel(usuario.role)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {admin && <>
            <AbaTab ativo={aba === 'produtos'} onClick={() => setAba('produtos')} icone={<Package size={14} />}>Produtos</AbaTab>
            <AbaTab ativo={aba === 'categorias'} onClick={() => setAba('categorias')} icone={<Tag size={14} />}>Categorias</AbaTab>
          </>}
          <AbaTab ativo={aba === 'pedidos'} onClick={() => setAba('pedidos')} icone={<MessageSquare size={14} />}>Pedidos & chat</AbaTab>
          {admin && <AbaTab ativo={aba === 'equipe'} onClick={() => setAba('equipe')} icone={<Users size={14} />}>Equipe</AbaTab>}
        </div>
      </div>
      <div className="mt-8">
        {aba === 'produtos' && admin && <AbaProdutos />}
        {aba === 'categorias' && admin && <AbaCategorias />}
        {aba === 'pedidos' && <AbaPedidos />}
        {aba === 'equipe' && admin && <AbaEquipe />}
      </div>
    </main>
  </AppShell>;
}

function AbaTab({ ativo, onClick, icone, children }: { ativo: boolean; onClick: () => void; icone: React.ReactNode; children: React.ReactNode }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${ativo ? 'border-[#ff534d] bg-[#ff534d]/12 text-white' : 'border-white/10 bg-white/[.03] text-[#97a2b4] hover:border-white/25 hover:text-white'}`}>{icone}{children}</button>;
}

// =================== Produtos ===================
function AbaProdutos() {
  const [produtos, setProdutos] = useState<Product[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<FormProduto | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    const [ps, cs] = await Promise.all([get<Product[]>('/admin/products'), get<Categoria[]>('/categories')]);
    setProdutos(ps); setCategorias(cs);
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  function editar(p: Product) {
    setForm({
      id: p.id, name: p.name, summary: p.summary, description: p.description,
      category_id: p.category_id || '', version: p.version,
      preco: centavosParaReais(p.price_cents), precoAntigo: centavosParaReais(p.old_price_cents),
      delivery: p.delivery, art: p.art, photo: p.photo || '', video: p.video || '',
      download_url: p.download_url || '', tags: p.tags.join(', '),
      published: p.published, featured: p.featured,
    });
    setErro('');
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErro('');
    const payload = {
      name: form.name, summary: form.summary, description: form.description,
      category_id: form.category_id || null, version: form.version,
      price_cents: reaisParaCentavos(form.preco),
      old_price_cents: form.precoAntigo ? reaisParaCentavos(form.precoAntigo) : null,
      delivery: form.delivery, art: form.art, photo: form.photo || null,
      video: form.video || null, download_url: form.download_url || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      published: form.published, featured: form.featured,
    };
    try {
      if (form.id) await patch(`/admin/products/${form.id}`, payload);
      else await post('/admin/products', payload);
      setForm(null);
      await carregar();
    } catch (err) { setErro((err as Error).message); }
  }

  async function excluir(id: string) {
    if (!window.confirm('Apagar este produto? Compras antigas ficam registradas.')) return;
    await del(`/admin/products/${id}`);
    await carregar();
  }

  async function alternar(p: Product, campo: 'published' | 'featured') {
    await patch(`/admin/products/${p.id}`, { [campo]: !p[campo] });
    await carregar();
  }

  return <div className="grid gap-8 xl:grid-cols-[1fr_.85fr]">
    <div>
      {produtos === null ? <div className="h-40 animate-pulse rounded-2xl bg-white/[.03]" /> : produtos.length === 0
        ? <Vazio icone={<Package size={26} />} titulo="Nenhum software cadastrado" texto="Crie o primeiro produto no formulário ao lado. Ele só aparece na loja quando você marcar 'Publicado'."><Botao onClick={() => setForm({ ...formVazio })}><Plus size={15} /> Novo produto</Botao></Vazio>
        : <div className="grid gap-3">{produtos.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-white">{p.name}</span>
                <span className="rounded border border-white/10 bg-white/[.04] px-1.5 py-0.5 text-[10px] text-[#8b96a8]">{p.category || 'sem categoria'}</span>
                {p.featured && <span className="flex items-center gap-1 text-[10px] font-bold text-[#ffb454]"><Star size={10} fill="currentColor" /> DESTAQUE</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-[#7f8b9d]">{p.price_cents ? moeda(p.price_cents) : 'Grátis'} · {p.published ? 'publicado' : 'oculto'} · {p.download_url ? 'link ok' : 'sem link'}</p>
            </div>
            <Botao variante="contorno" onClick={() => alternar(p, 'published')} className="!px-3 !py-1.5 !text-xs">{p.published ? 'Ocultar' : 'Publicar'}</Botao>
            <Botao variante="contorno" onClick={() => alternar(p, 'featured')} className="!px-3 !py-1.5 !text-xs">{p.featured ? 'Remover destaque' : 'Destacar'}</Botao>
            <button onClick={() => editar(p)} className="rounded-lg p-2 text-[#9da7b7] hover:bg-white/[.06] hover:text-white" title="Editar"><Pencil size={15} /></button>
            <button onClick={() => excluir(p.id)} className="rounded-lg p-2 text-[#9da7b7] hover:bg-red-500/15 hover:text-red-300" title="Apagar"><Trash2 size={15} /></button>
          </div>
        ))}</div>}
    </div>

    <div>
      {form ? (
        <form onSubmit={salvar} className="flex flex-col gap-4 rounded-2xl border border-white/[.08] bg-white/[.02] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">{form.id ? 'Editar produto' : 'Novo produto'}</h2>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg p-2 text-[#9da7b7] hover:bg-white/[.06] hover:text-white"><X size={16} /></button>
          </div>
          <Campo label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: MovieFlix" />
          <Campo label="Resumo" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Uma linha que vende o software" />
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">Descrição</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3.5 py-2.5 text-sm leading-6 text-[#e9edf2] outline-none focus:border-[#ff534d]/60" placeholder="O que faz, como instalar, requisitos…" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">Categoria</span>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3 py-2.5 text-sm text-[#e9edf2] outline-none focus:border-[#ff534d]/60">
                <option value="">Sem categoria</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
            <Campo label="Versão" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Preço (R$)" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} placeholder="0 = grátis" />
            <Campo label="Preço antigo (opcional)" value={form.precoAntigo} onChange={(e) => setForm({ ...form, precoAntigo: e.target.value })} placeholder="para riscar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">Entrega</span>
              <select value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3 py-2.5 text-sm text-[#e9edf2] outline-none focus:border-[#ff534d]/60">
                {ENTREGAS.map((x) => <option key={x}>{x}</option>)}
              </select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">Arte de fundo</span>
              <select value={form.art} onChange={(e) => setForm({ ...form, art: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3 py-2.5 text-sm text-[#e9edf2] outline-none focus:border-[#ff534d]/60">
                {ARTES.map((x) => <option key={x}>{x}</option>)}
              </select></label>
          </div>
          <Campo label="Link de download direto" value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} placeholder="https://… (o cliente clica e baixa)" />
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0e15] px-3 py-2 text-xs text-[#5f6b7f]"><Upload size={13} /> Cole o link do arquivo (Drive, MediaFire, GitHub releases…). O download libera só após pagamento.</div>
          <Campo label="URL da imagem (opcional)" value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://…/capa.png" />
          <Campo label="URL do vídeo demo (opcional)" value={form.video} onChange={(e) => setForm({ ...form, video: e.target.value })} placeholder="https://youtu.be/…" />
          <Campo label="Tags (vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="filmes, android, windows" />
          <div className="flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#c6cedb]"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-[#ff534d]" /> Publicado (visível na loja)</label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#c6cedb]"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-[#ffb454]" /> Destaque</label>
          </div>
          {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">{erro}</p>}
          <Botao type="submit">{form.id ? 'Salvar alterações' : 'Criar produto'}</Botao>
        </form>
      ) : (
        <button onClick={() => setForm({ ...formVazio })} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[.02] py-8 text-sm font-semibold text-[#97a2b4] transition hover:border-[#ff534d]/50 hover:text-white"><Plus size={16} /> Novo produto</button>
      )}
    </div>
  </div>;
}

// =================== Categorias ===================
function AbaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => setCategorias(await get<Categoria[]>('/categories')), []);
  useEffect(() => { void carregar(); }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await post('/admin/categories', { name: nome });
      setNome('');
      await carregar();
    } catch (err) { setErro((err as Error).message); }
  }

  return <div className="grid gap-8 lg:grid-cols-[1fr_.6fr]">
    <div>
      {categorias === null ? <div className="h-40 animate-pulse rounded-2xl bg-white/[.03]" /> : categorias.length === 0
        ? <Vazio icone={<Boxes size={26} />} titulo="Nenhuma categoria" texto="Crie categorias como 'Apps de filmes', 'Jogos', 'Ferramentas' para organizar o catálogo." />
        : <div className="grid gap-3">{categorias.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-3">
            <Tag size={14} className="text-[#ff625b]" />
            <span className="flex-1 font-display text-sm font-bold text-white">{c.name}</span>
            <span className="text-xs text-[#7f8b9d]">{c.products} {c.products === 1 ? 'produto' : 'produtos'}</span>
            <button onClick={async () => { if (window.confirm(`Apagar a categoria "${c.name}"?`)) { await del(`/admin/categories/${c.id}`); await carregar(); } }} className="rounded-lg p-2 text-[#9da7b7] hover:bg-red-500/15 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
        ))}</div>}
    </div>
    <form onSubmit={criar} className="flex h-fit flex-col gap-4 rounded-2xl border border-white/[.08] bg-white/[.02] p-6">
      <h2 className="font-display text-lg font-bold text-white">Nova categoria</h2>
      <Campo label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Apps de filmes" />
      {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">{erro}</p>}
      <Botao type="submit"><Plus size={15} /> Criar categoria</Botao>
    </form>
  </div>;
}

// =================== Pedidos & chat ===================
function AbaPedidos() {
  const [pedidos, setPedidos] = useState<TeamOrder[] | null>(null);
  const [chatAberto, setChatAberto] = useState<string | null>(null);

  useEffect(() => { void get<TeamOrder[]>('/team/orders').then(setPedidos).catch(() => setPedidos([])); }, []);

  return <div className="grid gap-8 xl:grid-cols-[1fr_.9fr]">
    <div>
      {pedidos === null ? <div className="h-40 animate-pulse rounded-2xl bg-white/[.03]" /> : pedidos.length === 0
        ? <Vazio icone={<MessageSquare size={26} />} titulo="Nenhum pedido ainda" texto="Quando um cliente comprar, o pedido aparece aqui com o chat de suporte." />
        : <div className="grid gap-3">{pedidos.map((o) => (
          <div key={o.id} className="grid items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-3 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-white">{o.product_name}</span>
                <StatusChip status={o.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-[#7f8b9d]">{o.client_name} · {o.client_email} · {moeda(o.amount_cents)} · {new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <Botao variante={chatAberto === o.id ? 'primario' : 'contorno'} onClick={() => setChatAberto(o.id)} className="!py-2 !text-xs"><MessageSquare size={13} /> Chat ({o.message_count})</Botao>
          </div>
        ))}</div>}
    </div>
    <div className="h-[560px]">{chatAberto ? <ChatPainel orderId={chatAberto} alturaFixa={false} /> : (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-[#5f6b7f]">Selecione um pedido para conversar com o cliente</div>
    )}</div>
  </div>;
}

// =================== Equipe ===================
function AbaEquipe() {
  const [equipe, setEquipe] = useState<Usuario[] | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<'moderador' | 'administrador'>('moderador');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => setEquipe(await get<Usuario[]>('/admin/users')), []);
  useEffect(() => { void carregar(); }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await post('/admin/users', { name: nome, email, password: senha, role: papel });
      setNome(''); setEmail(''); setSenha('');
      await carregar();
    } catch (err) { setErro((err as Error).message); }
  }

  return <div className="grid gap-8 lg:grid-cols-[1fr_.6fr]">
    <div>
      {equipe === null ? <div className="h-40 animate-pulse rounded-2xl bg-white/[.03]" /> : <div className="grid gap-3">{equipe.map((u) => (
        <div key={u.id} className="flex items-center gap-4 rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[.04] text-xs font-bold text-[#ff625b]">{u.name.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-white">{u.name}</p>
            <p className="truncate text-xs text-[#7f8b9d]">{u.email}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${u.role === 'administrador' ? 'border-[#ff534d]/30 bg-[#ff534d]/10 text-[#ff8a84]' : u.role === 'moderador' ? 'border-sky-500/25 bg-sky-500/10 text-sky-300' : 'border-white/10 bg-white/[.04] text-[#97a2b4]'}`}>{rotuloPapel(u.role)}</span>
          <button onClick={async () => { if (window.confirm(`Remover ${u.email}?`)) { await del(`/admin/users/${u.id}`); await carregar(); } }} className="rounded-lg p-2 text-[#9da7b7] hover:bg-red-500/15 hover:text-red-300"><Trash2 size={14} /></button>
        </div>
      ))}</div>}
    </div>
    <form onSubmit={criar} className="flex h-fit flex-col gap-4 rounded-2xl border border-white/[.08] bg-white/[.02] p-6">
      <h2 className="font-display text-lg font-bold text-white">Adicionar pessoa</h2>
      <p className="text-xs leading-5 text-[#7f8b9d]">Moderadores só conversam com clientes nos chats de compra. Administradores mexem em produtos, categorias e equipe.</p>
      <Campo label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <Campo label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Campo label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
      <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-[#8b96a8]">Papel</span>
        <select value={papel} onChange={(e) => setPapel(e.target.value as 'moderador' | 'administrador')} className="w-full rounded-lg border border-white/10 bg-[#0a0e15] px-3 py-2.5 text-sm text-[#e9edf2] outline-none focus:border-[#ff534d]/60">
          <option value="moderador">Moderador (só chat)</option>
          <option value="administrador">Administrador (tudo)</option>
        </select></label>
      {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">{erro}</p>}
      <Botao type="submit"><Plus size={15} /> Criar acesso</Botao>
    </form>
  </div>;
}
