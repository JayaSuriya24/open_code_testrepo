import { describe, expect, it } from "vitest";
import { filterProducts } from "./search.ts";
import type { Product } from "./schema.ts";

const base: Product = {
  slug: "",
  name: "",
  family: "mild-steel",
  process: "SMAW",
  tagline: "",
  classification: { aws: "", en_iso: null, is: null },
  coating: { type: null, description: null },
  current_types: ["AC", "DC+"],
  positions: ["1", "2", "3"],
  redry: null,
  packing: null,
  chemistry: [],
  mechanical: { tensile_min_mpa: null, yield_min_mpa: null, elongation_min_pct: null, impact: [] },
  sizes: [],
  applications: [],
  industries: [],
  datasheet: null,
  msds: null,
  equivalents: [],
};

function fixture(): Product[] {
  return [
    {
      ...base,
      slug: "e7018",
      name: "SLE-7018",
      classification: { aws: "E7018-1", en_iso: "E42 5 B 32", is: null },
      mechanical: { ...base.mechanical, tensile_min_mpa: 510, elongation_min_pct: 22 },
      sizes: [
        { diameter_mm: 2.5, length_mm: 350, amperage_min: 60, amperage_max: 110, pieces_per_packet: null, kg_per_carton: null },
        { diameter_mm: 3.15, length_mm: 350, amperage_min: 90, amperage_max: 140, pieces_per_packet: null, kg_per_carton: null },
      ],
      chemistry: [
        { element: "C", min: null, max: 0.05, typical: null },
        { element: "Mn", min: null, max: 0.4, typical: null },
      ],
    },
    {
      ...base,
      slug: "e7024",
      name: "SLE-7024",
      family: "high-deposition",
      classification: { aws: "E7024-1", en_iso: null, is: null },
      mechanical: { ...base.mechanical, tensile_min_mpa: 500, elongation_min_pct: 20 },
      sizes: [{ diameter_mm: 4.0, length_mm: 450, amperage_min: 170, amperage_max: 260, pieces_per_packet: null, kg_per_carton: null }],
      chemistry: [{ element: "C", min: null, max: 0.15, typical: null }],
    },
  ] as Product[];
}

describe("filterProducts", () => {
  it("matches AWS by substring, case-insensitively", () => {
    expect(filterProducts(fixture(), { aws: ["e7018-1"] })).toHaveLength(1);
    expect(filterProducts(fixture(), { aws: ["7018"] })).toHaveLength(1);
  });

  it("matches any of several AWS codes (OR)", () => {
    expect(filterProducts(fixture(), { aws: ["7024", "9999"] }).map((p) => p.slug)).toEqual(["e7024"]);
  });

  it("filters by family", () => {
    expect(filterProducts(fixture(), { families: ["high-deposition"] }).map((p) => p.slug)).toEqual(["e7024"]);
  });

  it("filters by diameter availability", () => {
    expect(filterProducts(fixture(), { diametersMm: [3.15] }).map((p) => p.slug)).toEqual(["e7018"]);
    expect(filterProducts(fixture(), { diametersMm: [3.15, 4.0] })).toHaveLength(2);
  });

  it("filters by positions and current types", () => {
    expect(filterProducts(fixture(), { positions: ["6"] })).toHaveLength(0);
    expect(filterProducts(fixture(), { positions: ["1", "4"] })).toHaveLength(2);
    expect(filterProducts(fixture(), { currentTypes: ["DC+"] })).toHaveLength(2);
  });

  it("filters by minimum tensile, excluding products with null tensile", () => {
    const fixtures = fixture();
    fixtures[0]!.mechanical.tensile_min_mpa = null;
    expect(filterProducts(fixtures, { minTensileMpa: 490 }).map((p) => p.slug)).toEqual(["e7024"]);
  });

  it("filters by minimum elongation", () => {
    expect(filterProducts(fixture(), { minElongationPct: 21 }).map((p) => p.slug)).toEqual(["e7018"]);
  });

  it("filters by chemistry ceiling and fails closed on unknown values", () => {
    expect(filterProducts(fixture(), { chemistryMax: { element: "c", max: 0.05 } }).map((p) => p.slug)).toEqual(["e7018"]);
    expect(filterProducts(fixture(), { chemistryMax: { element: "Si", max: 1 } })).toHaveLength(0);
  });

  it("combines criteria with AND", () => {
    expect(filterProducts(fixture(), { aws: ["7024"], minTensileMpa: 505 })).toHaveLength(0);
    expect(filterProducts(fixture(), { aws: ["7024"], minTensileMpa: 495 }).map((p) => p.slug)).toEqual(["e7024"]);
  });

  it("returns everything when criteria are empty", () => {
    expect(filterProducts(fixture(), {})).toHaveLength(2);
  });
});
