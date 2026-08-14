# DEPLOY — Sunline Endeavour

Two independently deployable artifacts. Nothing here is tied to a specific
cloud provider; pick hosts that support static hosting (web) and Node ≥ 22
(API) and keep this file honest with what you chose.

## Prereqs

- pnpm ≥ 9.15, Node ≥ 22 (the API runs `.ts` directly via Node type-stripping;
  there is no compile step — `pnpm -F @se/api build` is a typecheck gate).
- `.env` files per the examples at the repo root, `apps/web/.env.example`,
  `apps/api/.env.example`.

## 1. Web (static site)

1. Set `APP_URL` to the public origin, e.g. `APP_URL=https://www.sunlineendeavour.com`
   — it drives canonical URLs, the sitemap, and `robots.txt`. Build-time, not
   runtime: set it in the host's build environment.
2. `pnpm -F @se/web build` → upload `apps/web/dist/` to the static host
   (Cloudflare Pages / Netlify / Vercel all work).
3. Keep `public/_redirects` — Cloudflare Pages and Netlify honor it verbatim
   (legacy `Index.html` → 301 home, `send_email.php` → 410). Vercel needs the
   same map as `vercel.json` redirects (see `RUNBOOK.md §redirects`).
4. `robots.txt` and the sitemap are generated at build time; point both search
   consoles at `https://<domain>/sitemap-index.xml`.

## 2. API (Hono on Node)

Runs on any Node ≥ 22 host (Fly.io, Render, Railway, a container).

1. Copy `apps/api/.env.example` to `.env`. `NODE_ENV=production` **requires**
   `SMTP_HOST` — the API refuses to start without it, because RFQs would
   otherwise be silently dropped.
2. Start: `node --env-file-if-exists=.env apps/api/src/index.ts` (or run the
   same command in a container from the repo root).
3. `apps/web/.env` on the browser side points `PUBLIC_API_URL` at this origin;
   CORS allows exactly `APP_URL`.

## 3. Database (Postgres)

Optional — RFQs work by email alone. When `DATABASE_URL` is set, RFQs are
persisted.

- Use a managed Postgres (Neon / Supabase / RDS). Enabling the built-in
  automated backups + PITR is the backup strategy (see `RUNBOOK.md §backups`).
- Migrations live in `packages/db/migrations/` and are append-only. Apply
  them as part of the API deploy: `DATABASE_URL=… pnpm -F @se/db db:migrate`.

## 4. DNS + email authentication

Mail goes out from `SMTP_FROM` (default `rfq@sunlineendeavour.com`); the
visitor's address only ever appears in `Reply-To`. Before sending real mail,
publish at the DNS provider:

- **SPF** — a TXT record for the `sunlineendeavour.com` domain that includes
  the SMTP provider's mechanism, e.g.
  `v=spf1 include:<smtp-provider-include> -all`.
- **DKIM** — the SMTP provider's public key as a `default._domainkey` TXT
  record.
- **DMARC** — `v=DMARC1; p=quarantine; rua=mailto:…` to start; tighten to
  `p=reject` after a month of clean reports.
- Verify with MXToolbox / a DMARC analyzer before launch.

## 5. Verification checklist (run against production)

- `GET /health` → `200 {ok:true, service:"sunline-endeavour-api", db:"ok"}`
  (503 when the database is down).
- `POST /api/rfq` smoke test with one real SKU and a throwaway mailbox →
  `201` and an email arrives with `From:` on our domain and the test address
  in `Reply-To`.
- `https://<domain>/sitemap-index.xml` and `/robots.txt` resolve.
- `https://<domain>/Index.html` 301s to `/`; `/send_email.php` returns 410.
- Budget gate: `pnpm budget` (CI enforces it).
