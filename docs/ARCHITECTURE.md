# ARCHITECTURE.md

Phase-6 snapshot of the Sunline Endeavour workspace. Read this before any
structural change. Deploy/runbook details land in Phase 8.

## Workspace layout

```
sunline-endeavour/
├── package.json            # root: private, workspace scripts (pnpm -r)
├── pnpm-workspace.yaml     # packages: ["apps/*", "packages/*"]
├── tsconfig.base.json      # strict: noUncheckedIndexedAccess, exactOptionalPropertyTypes
├── eslint.config.js        # flat config: @eslint/js + typescript-eslint + eslint-plugin-astro + globals
├── AGENTS.md               # operating rules; the contract this repo runs on
├── MISSING-DATA.md         # every null spec value + reason, per (SKU, field)
├── docs/
│   ├── ARCHITECTURE.md     # this file
│   └── PHASE1-AUDIT.md     # legacy audit, spec extraction, phase execution plan
├── apps/
│   ├── web/                # Astro 6, output: "static" — the public site
│   └── api/                # Hono on Node — RFQ endpoint (Phase 3)
└── packages/
    ├── content/            # product data as YAML + Zod schema — SINGLE SOURCE OF TRUTH
    ├── db/                 # Drizzle — rfqs/rfq_items schema + migration 0000 (Phase 3)
    └── ui/                 # design tokens (tokens.css); primitives arrive with consumers
```

## Packages

### `packages/content` — the content layer

Everything a page shows about a product comes from `products/*.yaml`, validated
by `src/schema.ts` (Zod). Rules:

- Spec values exist ONLY in YAML. Never hardcode a spec in a component, page,
  or test fixture.
- A value that has no source is `null` and is listed in `MISSING-DATA.md`. The
  UI hides null fields; it never renders a placeholder.
- `products/` — one file per SKU. New SKUs follow the existing shape.

Loader entry points (share `parse.ts` so they can never diverge):

| Entry (`package.json` `exports`) | File | Runtime | Used by |
|---|---|---|---|
| `.` (`@se/content`) | `src/index.ts` | Node (fs via `import.meta.url`) | API, tests, `content:validate` |
| `./raw` (`@se/content/raw`) | `src/raw.ts` | Vite/Astro (YAML inlined via `?raw`) | `apps/web` |

Why two entries: `output: "static"` bundles Astro pages into `dist/`, which
breaks `import.meta.url`-relative fs reads. The web app therefore consumes the
`?raw` loader, which inlines the YAML at build time. Plain-Node consumers
(tests, `content:validate`, the future API) keep the fs loader. Both call
`parseProducts()` so behaviour and output order (sorted by slug) are identical.
`*.yaml?raw` module declarations live in `src/env.d.ts` (content) and
`apps/web/src/env.d.ts` — a file named `raw.d.ts` would be silently dropped by
TypeScript as the "generated declaration" of `raw.ts`.

Commands: `pnpm content:validate` (validates every YAML and prints the null
count), `pnpm -F @se/content test`.

### `packages/ui` — design tokens

`tokens.css` is the only allowed source of hex/px values. Components consume
semantic tokens (`--color-bg`, `--color-accent`, …), not raw palette. No
component may hardcode a hex or magic pixel value.

### `apps/web` — Astro 6 static site

- `output: "static"`; `site` from `APP_URL`, default `http://localhost:4321`.
- Astro 6 is required: every Astro 5.x fails to build Preact islands (the Vite
  SSR dep-optimizer cannot resolve the integration's `astro:preact:opts`
  virtual module).
- Preact islands only for genuine interactivity, hydrated with `client:visible`
  (never `client:load` unless above the fold). Everything else is `.astro` and
  ships zero JS. Islands: `ProductFinder` (catalogue), `RfqForm` (product pages
  + `/rfq`).
- The RFQ form posts to `PUBLIC_API_URL` (default `http://localhost:8787`),
  read from `import.meta.env`. Client validation is UX only; the API is the
  trust boundary.
- Pages import products from `@se/content/raw`.
- `src/layouts/Base.astro` is the single shell; pages fill the slot.
- Global styles in `src/styles/global.css` import `@se/ui/tokens.css`.
- Favicon lives at `public/assets/favicon.png`.

### `apps/api` — Hono on Node

- Plain Node 26 runs the TypeScript directly (`node --watch src/index.ts`);
  relative imports carry `.ts` extensions; `apps/api/tsconfig.json` enables
  `allowImportingTsExtensions` and inherits `noEmit`. No build step.
- `POST /api/rfq`: payload validated with Zod (`src/rfq/schema.ts`), SKUs
  resolved against `@se/content` (single source of truth — a bogus slug is a
  400), rate-limited per IP, persisted to Postgres via `@se/db` when
  `DATABASE_URL` is set, and emailed. Email delivery is the critical path:
  with no SMTP transport the console mailer logs the message (dev only —
  `NODE_ENV=production` refuses to start without `SMTP_HOST`).
- `POST /api/lookup`: batch specification search (AWS/family/diameter/
  mechanicals/chemistry) over the catalogue; mechanical matching fails closed
  on undeclared values.
- Security: all user values reaching email headers pass through
  `sanitizeHeader()` (strips CR/LF); `From` is always our own domain, the
  visitor's address goes in `Reply-To` only.
- Env validated at startup by `src/env.ts` (Zod). `apps/api/.env.example`
  documents every variable; `dev`/`start` use `node --env-file-if-exists=.env`.

### `packages/db` — Drizzle

- Postgres. `src/schema.ts` defines `rfqs` + `rfq_items`; migration
  `0000_*.sql` is generated and append-only. `src/index.ts` exports the schema
  and a lazy `createDb(url)` (no connection until called), so the API runs
  without a database. `.ts` extension imports; run directly by Node.

## Data flow

```
products/*.yaml ──► parse.ts ──┬─► index.ts (fs)   ──► tests / content:validate / API
                               └─► raw.ts (?raw)   ──► Astro pages
```

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspaces |
| `pnpm dev` | Astro dev + API watch, parallel |
| `pnpm build` | Build every workspace (web is static) |
| `pnpm typecheck` | `tsc --noEmit` everywhere + `astro check` |
| `pnpm lint` | ESLint flat config across the repo |
| `pnpm test` | Vitest in every workspace |
| `pnpm content:validate` | Validate all product YAML; reports null fields |

Close-out gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Phase 4 status (batch specification lookup)

- `filterProducts` + `LookupCriteria` live in `packages/content/src/search.ts`
  (pure, dependency-free, exported as `@se/content/search` so islands bundle
  only ~1.5 KB gz, not the YAML/zod layer). The Zod input schema
  (`lookupCriteriaSchema`) sits in `search-schema.ts`, server-side only.
- `POST /api/lookup`: matches the catalogue by AWS (substring, OR), family,
  diameter, positions, current types, min tensile, min elongation, and
  chemistry ceilings. Mechanical/chemistry matching **fails closed** — a
  product that does not declare a value is a non-match, never a guess.
- `/batch-lookup` page: `BatchLookup` Preact island filters client-side over
  the static product data (instant, works on a static host); API mirrors it
  for programmatic/CSV consumers.

## Phase 7 status (consumption calculator)

- `packages/content/src/consumption.ts` (exported as `@se/content/consumption`)
  is the pure, dependency-free calculator kernel — weld cross-section area per
  joint type (fillet, V, X, K, U), weld-metal kg from length and density, and
  electrode kg divided by process deposition efficiency. Sourced constants:
  efficiencies SMAW 0.70 / FCAW 0.87 / GMAW 0.98 / SAW 0.98, densities 7.80
  (C/C-Mn families) and 7.90 (stainless) from the product-plan §2.6.
  Hard-facing has no sourced density and is intentionally left undefined.
- `consumption-schema.ts` mirrors the kernel with a Zod discriminated union
  (server-side only), exported from the `@se/content` main entry; the island
  imports only the pure kernel so the bundle stays small.
- `/tools/consumption-calculator`: `ConsumptionCalculator` Preact island
  (`client:visible`). It estimates weld metal + electrode kg, optionally a cost
  at a user-entered rate, and offers a one-tap RFQ that deep-links to
  `/rfq?slugs=…&qty=…&note=…`. Rod count / cartons are absent because
  per-diameter packing weights are null across the catalogue (see
  `MISSING-DATA.md`).
- `RfqForm` gains `hydrateFromQuery` (`/rfq` only) and `initialMessage`;
  query-driven prefill lives in `apps/web/src/lib/rfq-prefill.ts` (pure,
  unit-tested) so a calculator result lands as a prefilled basket line with the
  consumption context in the message. Test fixtures verify the joint-area math
  against five hand-worked examples.
- `packages/content/src/selector.ts` (`@se/content/selector`) is the electrode
  wizard's decision table: base material → service condition → recommended SKU
  (or a fail-closed no-match for low-alloy, which the range does not declare).
  Guidance text refers only to declared facts (coating type, AWS class); a test
  asserts every recommended slug resolves in `products/`.
- `/tools/electrode-selector`: two-step `ElectrodeSelector` Preact wizard
  (`client:visible`) — base material, then application for carbon steel —
  ending in a recommendation card that offers a one-tap quote deep link. The two
  tools cross-link and both sit in the header/footer nav.

## Phase 6 status (budget enforcement + CI)

- `apps/web/scripts/budget.mjs` (run as `pnpm budget`) builds, walks each
  page's JS module graph, and asserts gzipped JS ≤ 25 KB (homepage) / 40 KB
  (everything else), plus warns on unreferenced `public/assets` files. Worst
  page today is ~11.9 KB gz.
- `.github/workflows/ci.yml` runs lint, typecheck, test, `content:validate`,
  build and the budget on push/PR, so the AGENTS.md performance-budget rule
  is now enforced in CI rather than prose.

## Phase 5 status (SEO & static hygiene)

- `Base.astro` head: canonical per page, Open Graph, Twitter card,
  `theme-color`, and a skip link; pages pass `path` for their canonical.
- `/robots.txt` is generated (`src/pages/robots.txt.ts`) so the Sitemap URL
  interpolates the configured `site` at build time; `404.html` ships with
  paths back to the catalogue and the RFQ.
- Footer gained a nav; dead assets removed (`rod.png` 387 KB and
  `hero-bg.webp` were unreferenced). `assets/certs/ISO.png` remains unused —
  it is unverified and must not be referenced until the current certificate
  is confirmed.
- Remaining from Phase 1: the schema gate (§6 step 3) and §2 spec migration
  (§6 step 4) still need human review of the open questions in §7 of
  `docs/PHASE1-AUDIT.md`. The About/Contact/Quality pages (phase brief's
  Phase 5) are deferred until §7 answers land, so no placeholder contact
  details or unverified claims ship.
