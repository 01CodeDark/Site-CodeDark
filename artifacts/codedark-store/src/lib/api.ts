// Cliente HTTP da API CodeDark (/api na Vercel)

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const resp = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) throw new ApiError(data?.error || 'Falha na comunicação com o servidor.', resp.status);
  return data as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body });
export const put = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body });
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' });

// ---------- tipos do domínio ----------

export type Papel = 'cliente' | 'moderador' | 'administrador';

export type Usuario = { id: string; name: string; email: string; role: Papel };

export type Categoria = { id: string; name: string; products: number };

export type Product = {
  id: string;
  name: string;
  summary: string;
  description: string;
  category_id: string | null;
  category: string | null;
  version: string;
  price_cents: number;
  old_price_cents: number | null;
  featured: boolean;
  published: boolean;
  art: string;
  photo: string | null;
  video: string | null;
  delivery: string;
  download_url: string | null;
  tags: string[];
  created_at: string;
};

export type Order = {
  id: string;
  status: 'pendente' | 'pago' | 'cancelado';
  amount_cents: number;
  created_at: string;
  paid_at: string | null;
  product_id: string;
  product_name: string;
  product_summary: string;
  delivery: string;
  download_url: string | null;
  art: string;
  photo: string | null;
  version: string;
  client_name?: string;
  client_email?: string;
  message_count?: number;
};

export type PagamentoInfo = { pix_key: string; pix_holder: string; pix_note: string };

export type Mensagem = {
  id: number;
  sender: 'cliente' | 'suporte';
  author: string | null;
  text_body: string;
  created_at: string;
};

export type TeamOrder = Order & { client_name: string; client_email: string; message_count: number };

// ---------- helpers ----------

export const moeda = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const reaisParaCentavos = (valor: string): number => {
  const limpo = valor.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

export const centavosParaReais = (cents: number | null): string =>
  cents == null ? '' : (cents / 100).toFixed(2).replace('.', ',');

export const ehEquipe = (u: Usuario | null) => Boolean(u && (u.role === 'administrador' || u.role === 'moderador'));
export const ehAdmin = (u: Usuario | null) => u?.role === 'administrador';

export const rotuloPapel = (p: Papel) => (p === 'administrador' ? 'Administrador' : p === 'moderador' ? 'Moderador' : 'Cliente');
export const rotuloStatus = (s: string) => (s === 'pago' ? 'Pago' : s === 'pendente' ? 'Aguardando PIX' : s === 'cancelado' ? 'Cancelado' : s);
