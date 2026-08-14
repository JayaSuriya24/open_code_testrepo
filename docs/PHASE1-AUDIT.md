# Phase 1 — Audit, Scaffold, Content Migration Plan

**Status:** for human review — do not build from this until the spec table (§2)
has been verified against QC datasheets and the open questions (§7) are answered.

---

## 1. File-by-file audit of the legacy code

### 1.1 Source inventory

The legacy site is split across **two unrelated folders**, plus this plan's PDF
sits in the workspace you started from.

| Path | Size | What it is |
|---|---|---|
| `Codes/SunlineEndeavour/index.html` | 36 KB | The current live site |
| `Codes/SunlineEndeavour/script.js` | 18 KB | Nav, animations, `CONFIG`, `productData`, modal |
| `Codes/SunlineEndeavour/style.css` | 36 KB | 36 custom-property tokens, 18 media queries |
| `Codes/SunlineEndeavour/assets/images/` | 3 assets | `Logo.png` (1.4 MB), `Logotab.png` (1.5 MB), `BackGround-Image.png` (267 KB) |
| `Codes/SunlineEndeavour/assets/datasheets/` | empty | Catalog PDF referenced but **missing** |
| `Codes/SE-Web-Sites/Index.html` | 52 KB | Superseded single-file version |
| `Codes/SE-Web-Sites/send_email.php` | 2 KB | Orphaned, vulnerable PHP mail handler |
| `Codes/SE-Web-Sites/images/` | 4 assets | `ISO.png`, `landing.png`, `rod.png`, `logo.jpg` |
| `Codes/SE-Web-Sites/README.md` | 1 KB | Instructions for the superseded site |
| `Codes/Opencode_test_site/Sunline-Endeavour-Web-App-Plan.md.pdf` | 715 KB | This plan, as PDF |

### 1.2 Verdict per file

| File | Verdict | Reason |
|---|---|---|
| `SunlineEndeavour/index.html` | **Port** (as content reference, not as code) | Best-quality copy (tagline, section order, WhatsApp float, bilingual intent). Specs and contact details are placeholder and must not carry over. |
| `SunlineEndeavour/script.js` | **Port** | The `CONFIG` shape (`whatsappNumber`, `messageEN`, `messageTA`) is explicitly to be preserved per the phase plan. `productData` becomes YAML. Modal/slideshow code is superseded by static pages — do not port. |
| `SunlineEndeavour/style.css` | **Port** | BEM discipline and the token-driven approach are good. Theme is re-based (see §5). No rules are imported verbatim. |
| `SunlineEndeavour/assets/images/Logo.png` | **Port** | Brand asset. 1.4 MB PNG is unusable at that size — must be re-encoded (AVIF/WebP fallback + explicit dimensions) before it ships. |
| `SunlineEndeavour/assets/images/Logotab.png` | **Port** | Favicon/apple-touch-icon source. Same re-encode requirement. |
| `SunlineEndeavour/assets/images/BackGround-Image.png` | **Port** | Hero background. Re-encode; verify actual resolution/quality against the new hero treatment. |
| `SunlineEndeavour/assets/datasheets/` | **Delete** | Empty folder; `Sunline-Endeavour-Catalog.pdf` link is broken. Record in `MISSING-DATA.md`. |
| `SE-Web-Sites/Index.html` | **Delete** | Superseded. Contains commented-out dead code for an earlier identity, duplicate product cards, and a Formspree placeholder form. **Extract first**: the SEP-6013/SEP-308L classification and packing rows feed the conflict table in §2; nothing else is carried forward. |
| `SE-Web-Sites/send_email.php` | **Delete** | Confirmed vulnerabilities, exactly as documented: unsanitised `$name` interpolated into `From:` (`$headers = "From: $name <$email>\r\n";` line 35), `FILTER_SANITIZE_STRING` (removed in PHP 8.1), and `From:` set to the visitor's address (SPF/DKIM fail). Negative reference only — its header-injection flaw is the genesis of the Phase 3 email hard rule and test. |
| `SE-Web-Sites/images/ISO.png` | **Port** (pending) | Real ISO certificate image. Needed for `/quality` (Phase 5) — verify it is the current certificate before use. |
| `SE-Web-Sites/images/rod.png` | **Port** (pending) | The only real product photograph. Candidate for product imagery — confirm it matches a real SKU. |
| `SE-Web-Sites/images/landing.png` | **Port** (pending) | Hero candidate. |
| `SE-Web-Sites/images/logo.jpg` | **Delete** | Belongs to the superseded ASA-era identity; `Logo.png` supersedes it. |
| `SE-Web-Sites/README.md` | **Delete** | Describes the deleted PHP flow. |
| `Opencode_test_site/…-Web-App-Plan.md.pdf` | **Keep out of repo** | Not site content. Source of this plan; optionally move to `docs/` for reference. |

---

## 2. Extracted specifications — **HUMAN VERIFICATION REQUIRED**

Everything below is lifted verbatim from the two HTML/JS sources. Nothing has
been inferred, corrected, or reconciled. The plan's constraint stands: if two
sources disagree, the conflict is surfaced here and **both** values go to
`null` in the YAML until QC resolves it.

### 2.1 Current site — `script.js` `productData` + cards in `index.html`

| SKU | Field | Value (verbatim) | Flag |
|---|---|---|---|
| SLE-6013 | Coating type | Rutile (Titania) Coated | ok |
| SLE-6013 | Sizes | 2.5mm, 3.15mm, 4.0mm, 5.0mm | ok |
| SLE-6013 | Pieces per carton | 150 pcs | **CONFLICT** with SEP-6013 packing (§2.2) |
| SLE-6013 | Cartons per box | 4 cartons | ok |
| SLE-6013 | Standards | AWS A5.1 E6013, IS 814 | ok |
| SLE-6013 | Card badge | "Best Seller" | marketing flag — is it current? |
| SLE-7018 | Coating type | Low Hydrogen Iron Powder | ok |
| SLE-7018 | Sizes | 3.15mm, 4.0mm, 5.0mm | ok |
| SLE-7018 | Pieces per carton | 120 pcs | ok |
| SLE-7018 | Cartons per box | 4 cartons | ok |
| SLE-7018 | Standards | AWS A5.1 E7018, IS 814 | ok |
| SLE-308L | Coating type | Lime-Titania Coated | ok |
| SLE-308L | Sizes | 2.5mm, 3.15mm, 4.0mm | ok |
| SLE-308L | Pieces per carton | 100 pcs | ok |
| SLE-308L | Cartons per box | 4 cartons | ok |
| SLE-308L | Standards | AWS A5.4 E308L-16 | ok |
| SLE-309 | Coating type | Lime-Titania Coated | ok |
| SLE-309 | Sizes | 3.15mm, 4.0mm | ok |
| SLE-309 | Pieces per carton | 100 pcs | ok |
| SLE-309 | Cartons per box | 4 cartons | ok |
| SLE-309 | Standards | AWS A5.4 E309-16 | ok |
| SLE-7024 | Coating type | Iron Powder Rutile | ok |
| SLE-7024 | Sizes | 4.0mm, 5.0mm | ok |
| SLE-7024 | Pieces per carton | 100 pcs | ok |
| SLE-7024 | Cartons per box | 4 cartons | ok |
| SLE-7024 | Standards | AWS A5.1 E7024 | ok |
| SLE-Hard | Coating type | "Special Alloy Coated" | **flag** — placeholder-grade; no alloy identity |
| SLE-Hard | Sizes | 3.15mm, 4.0mm | ok |
| SLE-Hard | Pieces per carton | 80 pcs | ok |
| SLE-Hard | Cartons per box | 4 cartons | ok |
| SLE-Hard | Standards | AWS A5.13 | ok (no class letter — needs `E×-T×` detail) |
| all | Product imagery | "Product Image 1/2/3" | **placeholder** — no real photos exist |

### 2.2 Superseded `Index.html` — only source for depth

| SKU | Field | Value (verbatim) | Flag |
|---|---|---|---|
| SEP-6013 | AWS/ASME | E6013 | ok |
| SEP-6013 | EN ISO | E 42 0 RC 11 | ok |
| SEP-6013 | IS | ER4211 | ok |
| SEP-6013 | Packing | 2.50mm = 100 Pcs/Box, 10 Boxes/Carton | **CONFLICT** with SLE-6013 |
| SEP-6013 | Packing | 3.15mm = 75 Pcs/Box, 10 Boxes/Carton | **CONFLICT** |
| SEP-6013 | Packing | 4.00mm = 50 Pcs/Box, 10 Boxes/Carton | **CONFLICT** |
| SEP-308L | AWS/ASME | E308L-16 | ok |
| SEP-308L | EN ISO | E 19 9 L R 12 | ok |
| SEP-308L | IS | E19.9LR26 | ok |
| SEP-308L | Packing | 2.5 / 3.15 / 4.0 = 2kg/Box, 10 Boxes/Carton | conflicts with SLE-308L "100 pcs" |
| E7018 / E7018-1 | — | Named in "Low Alloy Electrodes For Low Temperatures" card | no specs given |
| SEP | Datasheets | `/datasheet-sep6013.pdf`, `/datasheet-sep308l.pdf` | **broken links** — files do not exist |
| all | Product grid | Stainless and Hardfacing cards duplicated verbatim | **filler** — do not carry forward |

### 2.3 Data that does not exist anywhere in the codebase

These are the fields the new schema requires, and every one must be `null` in
the YAML + listed in `MISSING-DATA.md` until a QC datasheet supplies it:

- Weld-metal chemistry (any element)
- Mechanical properties (UTS, yield, elongation, impact energy / test temp)
- Amperage range per diameter
- Welding positions (per-SKU)
- Current types per SKU (only the AWS decoder implies them)
- Redry schedule
- Typical applications / industries per SKU
- Competitor equivalents
- Datasheet & MSDS file paths (none exist on disk)
- Certification details (ISO number, BIS/IS licence) — `ISO.png` exists but is unverified
- Contact details that are *real* (address, phone, email all conflict — §7)

### 2.4 Placeholder / filler strings found (full sweep)

| Location | Value |
|---|---|
| `index.html` contact card | "123 Industrial Estate, Manufacturing Zone, Chennai 600001" |
| `index.html` contact card | "+91 98765 43210" / "+91 44 2345 6789" |
| `script.js` CONFIG | `whatsappNumber: '+919840765477'` with comment "**Test number for receiving messages**" |
| `script.js` `productData` | all `slides: … text: 'Product Image 1…3'` |
| `index.html` footer | "© 2024 Sunline Endeavour" |
| `index.html` about stats | "20+ years / 50+ variants / 1000+ clients" — unverified marketing claims |
| `index.html` about copy | "over two decades" (implies founding ≈ 2004) |
| `Index.html` form | `action="https://formspree.io/f/YOUR_FORM_ID"` |
| `index.html` social | three `<a href="#">` social links (LinkedIn/Facebook/Twitter), no real URLs |
| `index.html` | `<h1 class="hero__title"></h1>` — empty, filled by nothing |

---

## 3. Zod content schema for a welding-electrode SKU

Source of truth: `packages/content/src/schema.ts`, validated by
`pnpm content:validate` against `packages/content/products/*.yaml`.

Design decisions, in schema shape:

```ts
import { z } from "zod";

const PositionCode = z.enum(["1", "2", "3", "4", "5", "6"]);       // AWS position digits
const CurrentType = z.enum(["AC", "DC+", "DC-", "AC_DC+"]);
const AlloyFamily = z.enum([
  "mild-steel", "low-alloy", "stainless-austenitic",
  "stainless-dissimilar", "high-deposition", "hard-facing",
]);
const Process = z.enum(["SMAW", "GMAW", "FCAW", "SAW"]);

const Classification = z.object({
  aws: z.string(),                      // e.g. "E6013", "E308L-16"
  en_iso: z.string().nullable(),        // e.g. "E 42 0 RC 11" — null until verified
  is: z.string().nullable(),            // e.g. "ER4211"
});

const ChemistryEntry = z.object({
  element: z.string(),                  // symbol, e.g. "C"
  min: z.number().nullable(),
  max: z.number().nullable(),
  typical: z.number().nullable(),       // at least one of min/max/typical must be set (refine)
});

const ImpactEntry = z.object({
  temperature_c: z.number().nullable(), // e.g. -30
  min_joules: z.number().nullable(),    // e.g. 47
});

const Mechanical = z.object({
  tensile_min_mpa: z.number().nullable(),   // e.g. 490
  yield_min_mpa: z.number().nullable(),     // e.g. 420
  elongation_min_pct: z.number().nullable(),// e.g. 22
  impact: z.array(ImpactEntry).default([]),
});

const Redry = z.object({
  temperature_c: z.number().nullable(),
  duration_h: z.number().nullable(),        // e.g. 1–2 → stored as min/max? keep simple: hours range string nullable
  note: z.string().nullable(),              // e.g. "Rerun required if exposed > 4 h"
});

const Size = z.object({
  diameter_mm: z.number().positive(),       // e.g. 3.15
  length_mm: z.number().positive().nullable(),
  amperage_min: z.number().positive().nullable(),
  amperage_max: z.number().positive().nullable(),
  pieces_per_packet: z.number().positive().int().nullable(),
  kg_per_carton: z.number().positive().nullable(),
});

const Equivalent = z.object({
  brand: z.string(),                        // e.g. "Esab", "Ador", "D&H Secheron"
  code: z.string(),                         // e.g. "OK 46.00"
});

export const ProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),   // "sle-6013"
  name: z.string(),                         // "SLE-6013"
  family: AlloyFamily,
  process: Process,
  tagline: z.string(),
  classification: Classification,
  coating: z.object({
    type: z.string().nullable(),            // "Rutile (Titania) Coated"
    description: z.string().nullable(),
  }),
  current_types: z.array(CurrentType).default([]),
  positions: z.array(PositionCode).default([]),
  redry: Redry.nullable().default(null),
  chemistry: z.array(ChemistryEntry).default([]),   // weld-metal, wt %
  mechanical: Mechanical.default({}),
  sizes: z.array(Size).default([]),
  applications: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  datasheet: z.string().nullable().default(null),   // path in apps/web/public
  msds: z.string().nullable().default(null),
  equivalents: z.array(Equivalent).default([]),
});

export type Product = z.infer<typeof ProductSchema>;
```

Notes the reviewer should confirm:
- **Null semantics.** Every spec field is nullable-or-defaulted-empty. The UI
  contract is "hide what is null" — no "N/A", no dash, no placeholder. This
  ships a deliberately thin page until QC data lands, which is correct.
- **`slug`** is the URL path; derive the canonical slug from the SKU brand
  prefix decision (§7).
- **Amperage** is per-size min/max numbers (matches "amperage per diameter"
  in the product brief). A per-SKU typical column can be added later if
  datasheets carry one.
- **Redry** stored as one schedule per SKU; if datasheets give per-diameter
  schedules, promote `redry` into `sizes[].redry` — flagging now so the schema
  is reviewed *before* the gate rather than migrated later.
- **Positions** use AWS position digit codes (`1` all-position … `6` overhead)
  so the decoder UI in Phase 2 can reuse them without a parallel mapping.
- **Chemistry** allows any of min/max/typical with a refine that at least one
  is present, and a `superRefine` that `max >= min` when both exist.
- `MISSING-DATA.md` is generated (or hand-maintained) from the validated set:
  one line per (SKU, field) where the value resolved to null.

---

## 4. Workspace scaffold — `Codes/sunline-endeavour/`

```
sunline-endeavour/
├── package.json                # root: private, workspace scripts
├── pnpm-workspace.yaml         # packages: ["apps/*", "packages/*"]
├── tsconfig.base.json          # strict: noUncheckedIndexedAccess, exactOptionalPropertyTypes
├── eslint.config.js            # flat config, typescript-eslint + astro plugin
├── vitest.workspace.ts
├── .gitignore
├── .editorconfig
├── .env.example                # APP_URL, RESEND_API_KEY, TURNSTILE, DB_URL, SESSION_SECRET…
├── AGENTS.md                   # created (matches the phase doc)
├── MISSING-DATA.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PHASE1-AUDIT.md         # this file
│   └── (DEPLOY.md / RUNBOOK.md land in Phases 8)
├── apps/
│   ├── web/                    # Astro 5, static by default
│   │   ├── package.json
│   │   ├── astro.config.mjs    # output: 'static', content config from packages/content
│   │   ├── tsconfig.json       # extends base, astro types
│   │   ├── public/
│   │   │   ├── favicon.svg     # derived from Logotab.png (re-encoded)
│   │   │   └── assets/         # ported + re-encoded images
│   │   └── src/
│   │       ├── layouts/Base.astro
│   │       ├── components/     # .astro only in Phase 1
│   │       ├── pages/index.astro
│   │       └── styles/global.css   # imports packages/ui/tokens.css
│   └── api/                    # Hono on Node — skeleton only in Phase 1
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts        # env-validated app bootstrap
│           └── routes/         # empty until Phase 3
├── packages/
│   ├── content/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── schema.ts       # §3
│   │   │   ├── types.ts        # exported Product type
│   │   │   ├── index.ts        # loadAll(): Product[] — reads YAML dir, validates, returns
│   │   │   └── index.test.ts   # colocated: schema + loader tests
│   │   ├── scripts/validate.mjs# backs `pnpm content:validate`
│   │   └── products/           # one YAML per SKU (Phase 1: nulls, §2 tables)
│   │       ├── sle-6013.yaml   ─┐
│   │       ├── sle-7018.yaml    │
│   │       ├── sle-308l.yaml    │ SKU set from §2 — names confirmed in §7
│   │       ├── sle-309.yaml     │
│   │       ├── sle-7024.yaml    │
│   │       └── sle-hard.yaml   ─┘
│   ├── db/                     # Drizzle — package + config only in Phase 1
│   │   ├── package.json
│   │   ├── drizzle.config.ts
│   │   ├── src/schema.ts       # empty (tables land Phase 3+)
│   │   └── migrations/         # append-only
│   └── ui/
│       ├── package.json
│       ├── tokens.css          # §5 design tokens
│       └── src/                # primitives arrive with their consumers
```

**Config choices and why**
- **pnpm 9** workspace — installed and current locally.
- **Astro 5, `output: 'static'`** — matches "static by default"; only islands ship JS.
- **Zod 4** in `packages/content` only; the API reuses the same schema for inbound payloads later.
- **Vitest** colocated `*.test.ts` per the code-style rules.
- **ESLint flat config** with `typescript-eslint` + `eslint-plugin-astro`; no Prettier (matches the legacy's hand-formatting style, avoids a second tool).
- **No Tailwind.** The AGENTS rule says tokens-only CSS; Tailwind would duplicate the token layer. Design tokens live in `packages/ui/tokens.css`.
- `drizzle-kit` and the `packages/db` package are scaffolded empty now so Phase 3 doesn't force a schema-adjacent structural change.

---

## 5. Design token migration

Legacy `:root` actually holds **36** custom properties (not 26 — the brief's
count misses the spacing/transition/shadow/radius/header groups). Grouped:

| Legacy token(s) | New token | Verdict | Why |
|---|---|---|---|
| `--steel-grey`, `--steel-grey-light`, `--steel-grey-dark` | `--graphite-300/500/900` | **replace** | Steels (cool greys) stay but re-based onto a graphite ramp; the blue family is the thing being removed. |
| `--deep-blue`, `--deep-blue-dark`, `--deep-blue-light`, `--primary-blue{,-light,-dark}`, `--accent-blue`, `--accent-blue-glow`, `--accent-blue-bright`, `--light-blue` | `--graphite-700…-800`, semantic `--color-ground/--color-surface` | **replace** | The entire corporate-blue identity goes. Blue reads "template", not "welding". |
| — | `--amber-400/500/600`, `--amber-glow`, `--arc`, `--slag` | **new** | Molten-amber accent from the weld pool (#F59F1A family); `--arc` (near-white warm) for highlights on graphite; `--slag` for cool neutral depth. Amber must pass 4.5:1 on both graphite and white — hence 400 (on dark) and 600 (on light) variants. |
| `--white`, `--off-white`, `--light-grey` | `--surface`, `--surface-muted`, `--graphite-50` | **rename** | Same role, named by function. |
| `--gradient-hero` | `--gradient-ground` (graphite 900→700) | **replace** | Hero moves from blue gradient to graphite ground with an amber ember overlay (CSS radial, no image needed). |
| `--gradient-card`, `--gradient-blue` | `--gradient-raised`, `--gradient-accent` | **replace** | Card sheen stays; the accent gradient becomes amber-on-graphite. |
| `--font-primary` (Inter) | `--font-body` (Inter, kept) | **keep** | Inter is the readable workhorse; no reason to add a font. |
| `--font-heading` (Oswald) | `--font-display` (Oswald, kept) | **keep** | Oswald *is* a condensed grotesk — the brief's desired display style. Keeping it avoids a new font dependency and its payload. If the brand wants a change, candidates are Archivo Narrow / Anton; flagging rather than deciding. |
| — | `--font-mono` (IBM Plex Mono, or `ui-monospace` stack) | **new** | Spec tables need stable tabular figures; pair with `font-variant-numeric: tabular-nums`. If IBM Plex Mono's payload worries the budget, the system `ui-monospace` stack is the free fallback. |
| `--section-padding`, `--container-max`, `--container-padding`, `--header-height` | same, token-blocked | **keep** | Layout constants are sound. |
| `--transition-fast/normal/slow`, `--shadow-sm/md/lg/glow`, `--radius-*` | same, renamed `--shadow-glow` → `--glow-amber` | **keep (minor rename)** | `--shadow-glow` was blue-tinted; re-tint to amber. |
| — | semantic layer: `--color-bg`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-on-dark`, `--color-border`, `--color-link`, `--color-danger`, `--focus-ring` | **new** | Components consume semantics, not raw palette. This is what makes the re-theme survivable. |

Justification summary: the brief's direction is sound — graphite ground gives
an industrial "consumables" feel; amber comes from the weld pool and doubles as
an accent that passes contrast on both graphite and light surfaces; condensed
display fits dense spec headers; mono + tabular figures serve the accuracy
audience. The only judgement call I'm flagging is **keeping Oswald/Inter**
rather than swapping typefaces — it achieves the stated direction with zero new
font payload.

---

## 6. Ordered execution steps, with exit criteria

Per the phase brief, stop **after step 3** for the schema review gate.

| # | Step | Exit criterion (verifiable) |
|---|---|---|
| 1 | Scaffold workspace: root configs + empty `apps/*` + `packages/*` per §4 | `pnpm install` clean; `pnpm typecheck` green on empty stubs; `pnpm dev` serves a bare Astro page |
| 2 | Port & re-encode assets (`Logo`, `Logotab`, `BackGround-Image`, candidates `ISO.png`/`rod.png`/`landing.png`) into `apps/web/public/assets` | All referenced images render; each shipped file ≤ its budget; width/height explicit in markup |
| 3 | **Schema gate.** Land `packages/content` schema (§3), YAML stubs with all-unverified fields as `null`, `content:validate` script, `MISSING-DATA.md` seeded from §2.3/§2.4 | `pnpm content:validate` passes; `MISSING-DATA.md` lists every null (SKU, field); **user reviews schema before SKU migration** |
| 4 | Migrate the §2 table into the 6 YAML files; conflicted values stay `null` and are listed in `MISSING-DATA.md` | `content:validate` green; zero invented values (spot-audit each non-null value has a source row in §2) |
| 5 | Implement `packages/ui/tokens.css` + `global.css` reset + bare `Base.astro`/homepage with new theme | Homepage renders on graphite/amber theme; `prefers-reduced-motion` respected; focus rings visible |
| 6 | Write `docs/ARCHITECTURE.md` | AGENTS.md-referenced doc exists; structure matches §4 |
| 7 | Phase-1 close-out | `pnpm lint && pnpm typecheck && pnpm test` all green; commit |

---

## 7. Open questions the codebase cannot answer

These block content migration (§6 step 4) and everything downstream. Answer as
many as you can before approving the plan; the rest go into `MISSING-DATA.md`
and the conflicting fields stay `null`.

1. **Legal entity / brand.** Is the manufacturer "Sunline Endeavour" as a brand
   of "ASA Industry" (est. 1996, Tiruchirappalli)? The superseded site says ASA
   Industry; the current site says Sunline Endeavour "over two decades"
   (~2004). Which name goes on the About page and which founding story is true?
2. **Spelling.** "Endeavour" (current site, this plan) vs "Endeavor"
   (superseded site, `sales@sunlineendeavor.com`). Confirm `sunlineendeavour.com`
   is the real domain.
3. **Phone.** `+91 98407 65477` (current site, commented "Test number") vs
   `+91 91718 78959` (superseded site). Which is the real sales number?
4. **Address.** "123 Industrial Estate, Chennai 600001" is clearly placeholder.
   The superseded site's "236/6, Trichy Salem Main Road, Savanthilingapuram,
   Musiri Tk, Srirangam, Tiruchirappalli-621202" looks real. Confirm.
5. **Product prefix.** `SLE-` (current) vs `SEP-` (superseded). Which is
   production? Are all six current SKUs (6013, 7018, 308L, 309, 7024, Hard)
   real products, or is SLE-Hard's coating description placeholder?
6. **Packing conflict.** E6013 is 150 pcs/carton (current) but 100/75/50 pcs
   per box × 10 boxes/carton (superseded). Same product, incompatible numbers.
   The QC datasheet settles this.
7. **Certification.** ISO 9001 number and BIS/IS licence number + the scanned
   certificates (`ISO.png`). Needed for Phase 5, but knowing they exist now
   prevents the About page from promising certs that don't.
8. **Imagery.** The only real product photo is `rod.png`. Will real
   product/facility photos be supplied before launch, or do we design with
   what exists?
9. **Legacy redirects.** Are any of these URLs currently indexed/linked
   (they determine the Phase 8 301 map): `/Index.html` (capital I),
   `/datasheet-sep6013.pdf`, `/datasheet-sep308l.pdf`,
   `/assets/datasheets/Sunline-Endeavour-Catalog.pdf`?
