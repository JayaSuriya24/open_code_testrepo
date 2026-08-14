# ARCHITECTURE.md

Phase-1 snapshot of the Sunline Endeavour workspace. Read this before any
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
│   ├── web/                # Astro 5, output: "static" — the public site
│   └── api/                # Hono on Node — skeleton (health route only in Phase 1)
└── packages/
    ├── content/            # product data as YAML + Zod schema — SINGLE SOURCE OF TRUTH
    ├── db/                 # Drizzle — config only; tables land Phase 3+
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

### `apps/web` — Astro 5 static site

- `output: "static"`; `site` from `APP_URL`, default `http://localhost:4321`.
- React islands only for genuine interactivity, hydrated with `client:visible`
  (never `client:load` unless above the fold). Everything else is `.astro` and
  ships zero JS.
- Pages import products from `@se/content/raw`.
- `src/layouts/Base.astro` is the single shell; pages fill the slot.
- Global styles in `src/styles/global.css` import `@se/ui/tokens.css`.
- Favicon lives at `public/assets/favicon.png`.

### `apps/api` — Hono on Node

Skeleton in Phase 1: `/health` only. Inbound RFQ payloads (Phase 3) reuse the
Zod schemas from `@se/content` for server-side validation. All user input is
validated server-side; client validation is UX only.

### `packages/db` — Drizzle

Config only in Phase 1. Migrations in `migrations/` are append-only; never edit
an applied migration.

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

## Phase 1 status

- Steps 1–5 of `docs/PHASE1-AUDIT.md` §6 are implemented; the schema gate
  (§6 step 3) and the §2 spec migration (§6 step 4) still need human review of
  the open questions in §7 of that doc.
- Assets: ported in Phase 1 are noted in `MISSING-DATA.md` where provenance is
  unverified (certification, product photography).
