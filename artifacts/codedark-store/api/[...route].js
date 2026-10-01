import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// ============================================================
// CodeDark Store — API serverless (Vercel)
// Banco: Neon Postgres (DATABASE_URL) · Pagamentos: PIX manual (liberação pelo dono)
// ============================================================

const COOKIE = 'cd_session';
const SESSION_DAYS = 30;
let _sql = null;
function db() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('Banco de dados indisponível: configure a variável DATABASE_URL na Vercel.');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// ---------- inicialização do banco (idempotente) ----------
let dbReady = null;
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'cliente',
    created_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    summary text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    version text NOT NULL DEFAULT '1.0.0',
    price_cents integer NOT NULL DEFAULT 0,
    old_price_cents integer,
    featured boolean NOT NULL DEFAULT false,
    published boolean NOT NULL DEFAULT false,
    art text NOT NULL DEFAULT 'forge',
    photo text,
    video text,
    delivery text NOT NULL DEFAULT 'Download imediato',
    download_url text,
    tags text[] NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id),
    user_id uuid NOT NULL REFERENCES users(id),
    status text NOT NULL DEFAULT 'pendente',
    amount_cents integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    paid_at timestamptz
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id bigserial PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender text NOT NULL,
    author text,
    text_body text NOT NULL,
    created_at timestamptz DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id)`,
];
function initDb() {
  if (!dbReady) dbReady = (async () => { for (const stmt of SCHEMA) await db()(stmt); })().catch((e) => { dbReady = null; throw e; });
  return dbReady;
}

// ---------- helpers ----------
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
  return;
}
const ok = (res, data) => json(res, 200, data);
const bad = (res, msg, status = 400) => json(res, status, { error: msg });

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
function setSessionCookie(res, token) {
  const exp = new Date(Date.now() + SESSION_DAYS * 86400000).toUTCString();
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; Expires=${exp}; HttpOnly; Secure; SameSite=Lax`);
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

function baseUrl(req) {
  const host = req.headers.host || 'codedark.vercel.app';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  return `${proto}://${host}`;
}

async function currentUser(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const rows = await db()`
    SELECT u.id, u.name, u.email, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1`;
  return rows[0] || null;
}

function requireAuth(user) { return user ? null : { status: 401, msg: 'Entre na sua conta para continuar.' }; }
function requireAdmin(user) { return user?.role === 'administrador' ? null : { status: 403, msg: 'Acesso restrito ao administrador.' }; }
function requireTeam(user) {
  return user && (user.role === 'administrador' || user.role === 'moderador')
    ? null
    : { status: 403, msg: 'Acesso restrito à equipe.' };
}

const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// ---------- catálogo ----------
async function listProducts(publishedOnly) {
  const campos = `p.id, p.name, p.summary, p.description, p.category_id,
    c.name AS category, p.version, p.price_cents, p.old_price_cents,
    p.featured, p.published, p.art, p.photo, p.video, p.delivery,
    p.download_url, p.tags, p.created_at`;
  const base = 'SELECT ' + campos + ' FROM products p LEFT JOIN categories c ON c.id = p.category_id';
  const rows = publishedOnly
    ? await db()(base + ' WHERE p.published = true ORDER BY p.featured DESC, p.created_at DESC')
    : await db()(base + ' ORDER BY p.featured DESC, p.created_at DESC');
  return rows.map((r) => ({ ...r, tags: r.tags || [] }));
}

async function getProduct(id, publishedOnly) {
  const campos = `p.id, p.name, p.summary, p.description, p.category_id,
    c.name AS category, p.version, p.price_cents, p.old_price_cents,
    p.featured, p.published, p.art, p.photo, p.video, p.delivery,
    p.download_url, p.tags, p.created_at`;
  const base = 'SELECT ' + campos + ' FROM products p LEFT JOIN categories c ON c.id = p.category_id';
  const rows = publishedOnly
    ? await db()(base + ' WHERE p.id = $1 AND p.published = true LIMIT 1', [id])
    : await db()(base + ' WHERE p.id = $1 LIMIT 1', [id]);
  const r = rows[0];
  return r ? { ...r, tags: r.tags || [] } : null;
}

// ---------- PIX (pagamento manual) ----------
async function getSetting(key) {
  const rows = await db()`SELECT value FROM settings WHERE key = ${key} LIMIT 1`;
  return rows[0]?.value || '';
}
async function setSetting(key, value) {
  await db()`
    INSERT INTO settings (key, value) VALUES (${key}, ${String(value || '')})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}
async function paymentInfo() {
  const [pix_key, pix_holder, pix_note] = await Promise.all([
    getSetting('pix_key'), getSetting('pix_holder'), getSetting('pix_note'),
  ]);
  return { pix_key, pix_holder, pix_note };
}

async function createOrder(user, productId) {
  const product = await getProduct(productId, true);
  if (!product) return { error: 'Produto não encontrado.', status: 404 };
  if (!product.price_cents) return { error: 'Produto gratuito: o download é direto na página dele.', status: 400 };

  const existing = await db()`
    SELECT id FROM orders
    WHERE user_id = ${user.id} AND product_id = ${product.id} AND status = 'pendente'
    ORDER BY created_at DESC LIMIT 1`;
  const order = existing[0] || (
    await db()`
      INSERT INTO orders (product_id, user_id, status, amount_cents)
      VALUES (${product.id}, ${user.id}, 'pendente', ${product.price_cents})
      RETURNING id`
  )[0];
  return { orderId: order.id };
}

// ---------- pedidos / chat ----------
async function orderWithProduct(orderId) {
  const rows = await db()`
    SELECT o.id, o.status, o.amount_cents, o.created_at, o.paid_at,
           p.id AS product_id, p.name AS product_name, p.summary AS product_summary,
           p.delivery, p.download_url, p.art, p.photo, p.version, p.category_id
    FROM orders o JOIN products p ON p.id = o.product_id
    WHERE o.id = ${orderId} LIMIT 1`;
  return rows[0] || null;
}

async function getMessages(orderId, afterId) {
  return afterId
    ? await db()`SELECT id, sender, author, text_body, created_at FROM messages WHERE order_id = ${orderId} AND id > ${afterId} ORDER BY id ASC`
    : await db()`SELECT id, sender, author, text_body, created_at FROM messages WHERE order_id = ${orderId} ORDER BY id ASC`;
}

// ============================================================
// Router
// ============================================================
export default async function handler(req, res) {
  await initDb();
  const url = new URL(req.url, 'http://x');
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean);
  const method = req.method;

  try {
    const user = await currentUser(req);
    const body = ['POST', 'PATCH', 'PUT'].includes(method) ? await readBody(req) : {};

    // ---------- health ----------
    if (parts[0] === 'health') return ok(res, { status: 'ok', db: true });

    // ---------- auth ----------
    if (parts[0] === 'auth' && parts[1] === 'register' && method === 'POST') {
      const { name, email, password } = body;
      if (!name || !isEmail(email) || !password || password.length < 6)
        return bad(res, 'Informe nome, email válido e senha com no mínimo 6 caracteres.');
      const exists = await db()`SELECT id FROM users WHERE lower(email) = ${email.toLowerCase().trim()} LIMIT 1`;
      if (exists.length) return bad(res, 'Este email já tem conta. Faça login.');
      const count = await db()`SELECT count(*)::int AS n FROM users`;
      const role = count[0].n === 0 ? 'administrador' : 'cliente'; // primeira conta = dono da loja
      const hash = await bcrypt.hash(password, 10);
      const rows = await db()`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (${name.trim()}, ${email.toLowerCase().trim()}, ${hash}, ${role})
        RETURNING id, name, email, role`;
      const token = crypto.randomBytes(32).toString('hex');
      await db()`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${rows[0].id}, now() + (${SESSION_DAYS} || ' days')::interval)`;
      setSessionCookie(res, token);
      return ok(res, rows[0]);
    }
    if (parts[0] === 'auth' && parts[1] === 'login' && method === 'POST') {
      const { email, password } = body;
      if (!isEmail(email) || !password) return bad(res, 'Informe email e senha.');
      const rows = await db()`SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = ${String(email).toLowerCase().trim()} LIMIT 1`;
      const found = rows[0];
      if (!found || !(await bcrypt.compare(password, found.password_hash)))
        return bad(res, 'Email ou senha incorretos.', 401);
      const token = crypto.randomBytes(32).toString('hex');
      await db()`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${found.id}, now() + (${SESSION_DAYS} || ' days')::interval)`;
      setSessionCookie(res, token);
      return ok(res, { id: found.id, name: found.name, email: found.email, role: found.role });
    }
    if (parts[0] === 'auth' && parts[1] === 'logout' && method === 'POST') {
      const token = parseCookies(req)[COOKIE];
      if (token) await db()`DELETE FROM sessions WHERE token = ${token}`;
      clearSessionCookie(res);
      return ok(res, { ok: true });
    }
    if (parts[0] === 'auth' && parts[1] === 'me' && method === 'GET') {
      return ok(res, { user });
    }

    // ---------- catálogo público ----------
    if (parts[0] === 'categories' && method === 'GET') {
      const rows = await db()`
        SELECT c.id, c.name, count(p.id) FILTER (WHERE p.published) AS products
        FROM categories c LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id, c.name ORDER BY c.name ASC`;
      return ok(res, rows);
    }
    if (parts[0] === 'products' && method === 'GET' && parts.length === 1) {
      return ok(res, await listProducts(true));
    }
    if (parts[0] === 'products' && method === 'GET' && parts.length === 2) {
      const product = await getProduct(parts[1], true);
      if (!product) return bad(res, 'Produto não encontrado.', 404);
      return ok(res, product);
    }
    if (parts[0] === 'payment-info' && method === 'GET') {
      return ok(res, await paymentInfo());
    }

    // ---------- minha conta / compras ----------
    const authErr = requireAuth(user);
    if (authErr) return bad(res, authErr.msg, authErr.status);

    if (parts[0] === 'checkout' && method === 'POST') {
      const result = await createOrder(user, body.productId);
      if (result.error) return bad(res, result.error, result.status);
      return ok(res, result);
    }
    if (parts[0] === 'orders' && method === 'GET' && parts.length === 1) {
      const rows = await db()`
        SELECT o.id, o.status, o.amount_cents, o.created_at, o.paid_at,
               p.id AS product_id, p.name AS product_name, p.summary AS product_summary,
               p.delivery, p.art, p.photo, p.version
        FROM orders o JOIN products p ON p.id = o.product_id
        WHERE o.user_id = ${user.id}
        ORDER BY o.created_at DESC`;
      return ok(res, rows);
    }
    if (parts[0] === 'orders' && parts.length >= 2) {
      const orderId = parts[1];
      const order = await orderWithProduct(orderId);
      // pertence ao cliente (ou é equipe)
      const own = await db()`SELECT user_id FROM orders WHERE id = ${orderId} LIMIT 1`;
      if (!own.length) return bad(res, 'Pedido não encontrado.', 404);
      const isOwner = own[0].user_id === user.id;
      const teamErr = requireTeam(user);
      if (!isOwner && teamErr) return bad(res, teamErr.msg, teamErr.status);

      if (parts[2] === undefined && method === 'GET') {
        const fresh = await orderWithProduct(orderId);
        const cliente = !isOwner || user.role === 'cliente';
        if (cliente && fresh.status !== 'pago') delete fresh.download_url; // link só depois do PIX confirmado
        return ok(res, { ...fresh, messages: await getMessages(orderId) });
      }
      if (parts[2] === 'messages' && method === 'GET') {
        return ok(res, await getMessages(orderId, Number(url.searchParams.get('after')) || 0));
      }
      if (parts[2] === 'messages' && method === 'POST') {
        const text = String(body.text || '').trim();
        if (!text) return bad(res, 'Mensagem vazia.');
        const isTeam = !teamErr;
        await db()`
          INSERT INTO messages (order_id, sender, author, text_body)
          VALUES (${orderId}, ${isTeam ? 'suporte' : 'cliente'}, ${user.name}, ${text.slice(0, 2000)})`;
        return ok(res, await getMessages(orderId));
      }
    }

    // ---------- equipe (admin + moderador) ----------
    const teamErr = requireTeam(user);
    if (teamErr) return bad(res, teamErr.msg, teamErr.status);

    if (parts[0] === 'team' && parts[1] === 'orders' && parts[2] && parts.length === 4 && method === 'POST'
        && (parts[3] === 'release' || parts[3] === 'cancel')) {
      const adminOnly = requireAdmin(user);
      if (adminOnly) return bad(res, adminOnly.msg, adminOnly.status);
      const orderId = parts[2];
      if (parts[3] === 'release') {
        const rows = await db()`
          UPDATE orders SET status = 'pago', paid_at = now()
          WHERE id = ${orderId} AND status = 'pendente' RETURNING id`;
        if (!rows.length) return bad(res, 'Pedido não encontrado ou já liberado.', 404);
        await db()`
          INSERT INTO messages (order_id, sender, author, text_body)
          VALUES (${orderId}, 'suporte', 'CodeDark', 'Pagamento confirmado ✓ Seu download está liberado. Qualquer coisa, chama aqui.')`;
        return ok(res, { ok: true, status: 'pago' });
      }
      const rows = await db()`
        UPDATE orders SET status = 'cancelado' WHERE id = ${orderId} RETURNING id`;
      if (!rows.length) return bad(res, 'Pedido não encontrado.', 404);
      return ok(res, { ok: true, status: 'cancelado' });
    }
    if (parts[0] === 'team' && parts[1] === 'orders' && method === 'GET') {
      const rows = await db()`
        SELECT o.id, o.status, o.amount_cents, o.created_at, o.paid_at,
               p.name AS product_name, u.name AS client_name, u.email AS client_email,
               (SELECT count(*)::int FROM messages m WHERE m.order_id = o.id) AS message_count
        FROM orders o
        JOIN products p ON p.id = o.product_id
        JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 200`;
      return ok(res, rows);
    }

    // ---------- admin ----------
    const adminErr = requireAdmin(user);
    if (adminErr) return bad(res, adminErr.msg, adminErr.status);

    if (parts[0] === 'admin' && parts[1] === 'settings') {
      if (method === 'GET') return ok(res, await paymentInfo());
      if (method === 'PUT' || method === 'PATCH') {
        await setSetting('pix_key', String(body.pix_key || '').trim());
        await setSetting('pix_holder', String(body.pix_holder || '').trim());
        await setSetting('pix_note', String(body.pix_note || '').trim());
        return ok(res, await paymentInfo());
      }
    }
    if (parts[0] === 'admin' && parts[1] === 'products') {
      if (method === 'GET') return ok(res, await listProducts(false));
      if (method === 'POST') {
        const p = body;
        if (!p?.name) return bad(res, 'O produto precisa de um nome.');
        const rows = await db()`
          INSERT INTO products (name, summary, description, category_id, version, price_cents,
            old_price_cents, featured, published, art, photo, video, delivery, download_url, tags)
          VALUES (${p.name.trim()}, ${p.summary || ''}, ${p.description || ''},
                  ${p.category_id || null}, ${p.version || '1.0.0'}, ${Math.max(0, Number(p.price_cents) || 0)},
                  ${p.old_price_cents != null ? Number(p.old_price_cents) || null : null},
                  ${Boolean(p.featured)}, ${Boolean(p.published)}, ${p.art || 'forge'},
                  ${p.photo || null}, ${p.video || null}, ${p.delivery || 'Download imediato'},
                  ${p.download_url || null}, ${Array.isArray(p.tags) ? p.tags.map(String) : []})
          RETURNING id`;
        return ok(res, rows[0]);
      }
      if (method === 'PATCH' && parts[2]) {
        const p = body;
        const rows = await db()`
          UPDATE products SET
            name = COALESCE(${p.name ?? null}, name),
            summary = COALESCE(${p.summary ?? null}, summary),
            description = COALESCE(${p.description ?? null}, description),
            category_id = COALESCE(${p.category_id !== undefined ? (p.category_id || null) : null}, category_id),
            version = COALESCE(${p.version ?? null}, version),
            price_cents = COALESCE(${p.price_cents !== undefined ? Math.max(0, Number(p.price_cents) || 0) : null}, price_cents),
            old_price_cents = COALESCE(${p.old_price_cents != null ? Number(p.old_price_cents) || null : null}, old_price_cents),
            featured = COALESCE(${p.featured !== undefined ? Boolean(p.featured) : null}, featured),
            published = COALESCE(${p.published !== undefined ? Boolean(p.published) : null}, published),
            art = COALESCE(${p.art ?? null}, art),
            photo = COALESCE(${p.photo || null}, photo),
            video = COALESCE(${p.video || null}, video),
            delivery = COALESCE(${p.delivery ?? null}, delivery),
            download_url = COALESCE(${p.download_url || null}, download_url),
            updated_at = now()
          WHERE id = ${parts[2]}
          RETURNING id`;
        if (!rows.length) return bad(res, 'Produto não encontrado.', 404);
        return ok(res, rows[0]);
      }
      if (method === 'DELETE' && parts[2]) {
        await db()`DELETE FROM products WHERE id = ${parts[2]}`;
        return ok(res, { ok: true });
      }
    }
    if (parts[0] === 'admin' && parts[1] === 'categories') {
      if (method === 'POST') {
        const name = String(body.name || '').trim();
        if (!name) return bad(res, 'Nome da categoria em branco.');
        const rows = await db()`
          INSERT INTO categories (name) VALUES (${name})
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id, name`;
        return ok(res, rows[0]);
      }
      if (method === 'DELETE' && parts[2]) {
        await db()`DELETE FROM categories WHERE id = ${parts[2]}`;
        return ok(res, { ok: true });
      }
    }
    if (parts[0] === 'admin' && parts[1] === 'users') {
      if (method === 'GET') {
        const rows = await db()`SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC`;
        return ok(res, rows);
      }
      if (method === 'POST') {
        const { name, email, password, role } = body;
        if (!name || !isEmail(email) || !password || password.length < 6)
          return bad(res, 'Nome, email válido e senha (mín. 6 caracteres).');
        if (role !== 'moderador' && role !== 'administrador' && role !== 'cliente')
          return bad(res, 'Papel inválido.');
        const exists = await db()`SELECT id FROM users WHERE lower(email) = ${email.toLowerCase().trim()} LIMIT 1`;
        if (exists.length) return bad(res, 'Já existe uma conta com este email.');
        const hash = await bcrypt.hash(password, 10);
        const rows = await db()`
          INSERT INTO users (name, email, password_hash, role)
          VALUES (${name.trim()}, ${email.toLowerCase().trim()}, ${hash}, ${role})
          RETURNING id, name, email, role`;
        return ok(res, rows[0]);
      }
      if (method === 'DELETE' && parts[2]) {
        if (parts[2] === user.id) return bad(res, 'Você não pode remover a si mesmo.');
        await db()`DELETE FROM users WHERE id = ${parts[2]}`;
        return ok(res, { ok: true });
      }
    }

    return bad(res, 'Rota não encontrada.', 404);
  } catch (err) {
    console.error('API error:', err && err.message ? err.message : err);
    if (String(err?.message || '').includes('database') || String(err?.message || '').includes('connection'))
      return bad(res, err && err.message && err.message.startsWith('Banco de dados') ? err.message : 'Banco de dados indisponível: confira a variável DATABASE_URL.', 503);
    return bad(res, 'Erro interno no servidor.', 500);
  }
}
