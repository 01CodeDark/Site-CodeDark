# CodeDark Store

Storefront cyber/dark da CodeDark para vender software, entregar arquivos e oferecer suporte pós-compra com permissões de equipe.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/codedark-store/src/App.tsx` — storefront, biblioteca, checkout, suporte pós-compra e painel protegido por função.
- `artifacts/codedark-store/src/index.css` — CodeDark dark/red theme, typography, texture, and motion utilities.
- `artifacts/codedark-store/public/codedark-logo.png` — provided CodeDark brand asset.
- `artifacts/codedark-store/public/cybernetix-reference.png` — referência visual cyber usada no hero da loja.
- `artifacts/api-server/src/app.ts` — Express API shell with Clerk proxy/middleware wiring.

## Architecture decisions

- The first storefront build uses localStorage demo persistence so catalog, coupon, delivery, library, and support interactions can be previewed immediately.
- A prévia usa persistência local para permitir testar compra, biblioteca, equipe, permissões e suporte sem credenciais externas.
- Product artwork is generated as CSS compositions so the catalog stays lightweight and matches the supplied logo.

## Product

- Public CodeDark storefront with search, category filters, featured releases, product detail pages, pricing, and delivery metadata.
- Customer area with purchased library, download links, and a support chat released only after purchase.
- Admin workspace with product create/edit/delete, coupon toggling, delivery links, product photo/video upload, extra links, and team role assignment.
- Moderator workspace restricted to buyer chat replies; only designated administrators can manage products and team permissions.

## User preferences

- The visual identity should stay direct, dark, red-accented, cyber/enterprise, and low on unnecessary copy.
- The homepage title must remain `CODEDARK Software that works in the dark.`

## Gotchas

- The Vite build requires `PORT` and `BASE_PATH`; workflows inject them automatically.
- The first build's catalog and admin state are browser-local preview data, not yet a server-backed commerce system.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
