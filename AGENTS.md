# AGENTS.md — Sunline Endeavour

## Project
Public website and B2B web application for Sunline Endeavour, a welding
electrode (SMAW consumables) manufacturer in Tamil Nadu, India.

Audience, in priority order:
1. Plant/welding engineers — need exact specs: AWS/IS/ISO class, chemistry,
   mechanicals, amperage per diameter, positions, redry schedule
2. Procurement managers — need price, quantity, lead time, certifications
3. Distributors — need catalogue, stock, test certificates

Primary conversion event is the RFQ, not a checkout. Every page must offer a
path to a quote appropriate to that page's stage of the buying journey.

## Commands
Install:      pnpm install
Dev:          pnpm dev
Build:        pnpm build
Typecheck:    pnpm typecheck
Lint:         pnpm lint
Test:         pnpm test
Test one:     pnpm vitest run path/to/file.test.ts
Validate data: pnpm content:validate

Run `pnpm lint && pnpm typecheck && pnpm test` before declaring any task done.

## Architecture
- `apps/web/`          Astro 5 — public site, static by default
- `apps/api/`          Hono on Node — RFQ, batch lookup, portal, admin
- `packages/content/`  Product data as YAML + Zod schema — SINGLE SOURCE OF TRUTH
- `packages/db/`       Drizzle schema and migrations
- `packages/ui/`       Shared design tokens and primitives

## Hard rules
- Product specifications live ONLY in `packages/content/products/*.yaml`.
  Never hardcode a spec value in a component, a page, or a test fixture.
  If a page needs a spec, import it from the content layer.
- Preact/React islands are for genuine interactivity only: calculators, the
  product finder, the selector wizard, the RFQ basket, forms. Everything else
  is `.astro` and ships zero JavaScript. Preact is the default island
  framework (React-sized JSX at ~8 KB gzipped vs ~45 KB for react-dom, which
  would breach the catalogue JS budget); add React only if a dependency
  requires it.
- Islands hydrate with `client:visible`, never `client:load`, unless the
  component is above the fold.
- All user input is validated server-side with Zod. Client validation is UX
  only and is never trusted.
- Any value that reaches an email header MUST have `\r` and `\n` stripped
  first. `From:` is always our own domain; the visitor's address goes in
  `Reply-To:` only.
- Never commit secrets. Everything sensitive comes from env vars, validated
  at startup with Zod. `.env.example` stays current.
- Migrations in `packages/db/migrations/` are append-only. Never edit one
  that has been applied.
- Do not add a dependency without saying why in the commit message. Prefer
  the platform. No jQuery, no Bootstrap, no moment.js, no animation library
  for things CSS can do.

## Accuracy rule — read this twice
This is technical documentation for industrial consumables. A wrong amperage
range or composition percentage is a safety and liability issue, not a typo.

NEVER invent, infer, interpolate, or "reasonably estimate" a specification
value. If a value is not present in the source material you were given, set
it to `null` and add it to `MISSING-DATA.md` with the SKU and field name.
The UI must hide null fields rather than showing a placeholder.

## Code style
- TypeScript strict. No `any` — use `unknown` and narrow.
- Named exports. No default exports except Astro pages and React islands.
- `const` by default; `let` only when reassignment is genuinely needed.
- Colocate tests as `*.test.ts` next to the unit under test.
- CSS: design tokens from `packages/ui/tokens.css` only. No hardcoded hex
  values, no magic pixel numbers outside the token file.
- Spec tables use tabular figures (`font-variant-numeric: tabular-nums`).

## Performance budget — CI fails if breached
- LCP < 2.0s mobile 4G, CLS < 0.1, INP < 200ms
- JS ≤ 25 KB gzipped on the homepage, ≤ 40 KB on catalogue pages
- Lighthouse Performance / SEO / Accessibility ≥ 95
- Images: AVIF with WebP fallback, explicit width and height always

## Accessibility floor
Keyboard reachable, visible focus rings, `prefers-reduced-motion` respected,
tap targets ≥ 44px, modals trap focus and close on Escape, forms have real
`<label>` elements. No `onclick` on a non-interactive element.

## Agent notes
- Read `docs/ARCHITECTURE.md` before any structural change.
- Use Plan mode for anything touching the content schema or the API surface.
- The legacy `Index.html` and `send_email.php` are deleted deliberately —
  do not resurrect patterns from them. `send_email.php` contained a mail
  header injection vulnerability; treat it as a negative reference only.
