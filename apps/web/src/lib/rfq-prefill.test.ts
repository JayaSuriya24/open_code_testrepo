import { describe, expect, it } from "vitest";
import { readQueryPrefill } from "./rfq-prefill";
import type { Product } from "@se/content/raw";

const base: Product = {
  slug: "",
  name: "",
  family: "mild-steel",
  process: "SMAW",
  tagline: "",
  classification: { aws: "", en_iso: null, is: null },
  coating: { type: null, description: null },
  current_types: [],
  positions: [],
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
    { ...base, slug: "sle-6013", name: "SLE-6013" },
    { ...base, slug: "sle-7018", name: "SLE-7018" },
  ] as Product[];
}

describe("readQueryPrefill", () => {
  it("returns null when there is no slugs parameter", () => {
    expect(readQueryPrefill(fixture(), "?qty=5")).toBeNull();
    expect(readQueryPrefill(fixture(), "")).toBeNull();
  });

  it("returns null when every slug is unknown", () => {
    expect(readQueryPrefill(fixture(), "?slugs=sle-9999")).toBeNull();
  });

  it("keeps known slugs and drops unknown ones", () => {
    const prefill = readQueryPrefill(fixture(), "?slugs=sle-6013,sle-9999,sle-7018");
    expect(prefill?.slugs).toEqual(["sle-6013", "sle-7018"]);
  });

  it("applies the qty parameter and defaults to 1 when invalid", () => {
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&qty=44")?.qty).toBe(44);
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&qty=0")?.qty).toBe(1);
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&qty=-3")?.qty).toBe(1);
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&qty=2.5")?.qty).toBe(1);
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&qty=1000001")?.qty).toBe(1);
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&qty=abc")?.qty).toBe(1);
  });

  it("passes the note through", () => {
    expect(readQueryPrefill(fixture(), "?slugs=sle-6013&note=hello")?.note).toBe("hello");
  });

  it("truncates the note to 2000 characters", () => {
    const long = "a".repeat(3000);
    expect(readQueryPrefill(fixture(), `?slugs=sle-6013&note=${long}`)?.note).toHaveLength(2000);
  });
});
