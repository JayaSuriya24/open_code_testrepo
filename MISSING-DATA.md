# MISSING-DATA.md

Every `null` specification value below needs a human-supplied value (QC
datasheet, packing list, or a business decision) before it can ship. The UI
hides null fields; nothing here is ever rendered as a placeholder.

## Blocking business decisions — from docs/PHASE1-AUDIT.md §7

- [ ] SLE vs SEP product prefix — which is the production brand?
- [ ] Real phone number — +91 98407 65477 is commented "Test number for
      receiving messages"; +91 91718 78959 appears in the superseded site.
- [ ] Real address — "123 Industrial Estate, Chennai 600001" is placeholder;
      the superseded site's "236/6, Trichy Salem Main Road, Savanthilingapuram,
      Musiri Tk, Srirangam, Tiruchirappalli-621202" looks real.
- [ ] Brand spelling — Endeavour vs Endeavor; confirm the real domain.
- [ ] Legal entity / founding story — ASA Industry (est. 1996) vs Sunline
      Endeavour "over two decades".

## Per-SKU missing specification values

| SKU | Field | Reason |
|---|---|---|
| sle-6013 | classification.en_iso | Only present in superseded SEP-6013 (E 42 0 RC 11); SEP→SLE identity unconfirmed |
| sle-6013 | classification.is | Only in superseded SEP-6013 (ER4211); identity unconfirmed |
| sle-6013 | packing.pieces_per_carton | Conflict: current site "150 pcs/carton" vs superseded "100/75/50 pcs per box × 10 boxes" |
| sle-6013 | sizes[].length_mm / amperage / pieces_per_packet / kg_per_carton | No source in any legacy file |
| sle-6013 | chemistry / mechanical / redry / current_types / positions | No source in any legacy file |
| sle-6013 | datasheet / msds | Files missing — assets/datasheets/ is empty |
| sle-7018 | classification.en_iso / is | No source; superseded site only names "E7018 / E7018-1" without codes |
| sle-7018 | family | Current site cites AWS A5.1 (mild-steel); superseded site markets E7018 as low-alloy/low-temperature — resolved as mild-steel pending datasheet |
| sle-7018 | sizes[].length_mm / amperage / pieces_per_packet / kg_per_carton | No source |
| sle-7018 | chemistry / mechanical / redry / current_types / positions | No source |
| sle-308l | packing (all) | Incompatible schemes: current site "100 pcs / 4 cartons" vs superseded SEP-308L "2kg/box × 10 boxes" |
| sle-308l | classification.en_iso / is | Only in superseded SEP-308L (E 19 9 L R 12 / E19.9LR26); identity unconfirmed |
| sle-308l | sizes[].length_mm / amperage / pieces_per_packet / kg_per_carton | No source |
| sle-308l | chemistry / mechanical / redry / current_types / positions | No source |
| sle-309 | sizes[].length_mm / amperage / pieces_per_packet / kg_per_carton | No source |
| sle-309 | chemistry / mechanical / redry / current_types / positions / equivalents | No source |
| sle-7024 | sizes[].length_mm / amperage / pieces_per_packet / kg_per_carton | No source |
| sle-7024 | chemistry / mechanical / redry / current_types / positions / equivalents | No source |
| sle-hard | coating.type | "Special Alloy Coated" is placeholder-grade; no alloy identity |
| sle-hard | classification.aws | Only "A5.13" (a standard, not a class); needs the full hard-facing designation |
| sle-hard | sizes[].length_mm / amperage / pieces_per_packet / kg_per_carton | No source |
| sle-hard | chemistry / mechanical / redry / current_types / positions / equivalents | No source |

## Missing files

- `assets/datasheets/Sunline-Endeavour-Catalog.pdf` — referenced by the legacy
  site, not present on disk.
- `/datasheet-sep6013.pdf`, `/datasheet-sep308l.pdf` — referenced by the
  superseded site, not present.
- Product photography — every legacy product image is a "Product Image 1/2/3"
  placeholder; the only real photo is `rod.png` (unverified SKU match).
- Certification details — `ISO.png` exists but is unverified; no ISO 9001
  number or BIS/IS licence number documented anywhere.
- Per-SKU applications, industries and competitor equivalents — no source.
