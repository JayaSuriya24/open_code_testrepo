import { describe, expect, it } from "vitest";
import { loadAllProducts, loadProduct } from "./index.ts";
import { ProductSchema } from "./schema.ts";

describe("content layer", () => {
  it("loads and validates every product YAML without throwing", () => {
    expect(() => loadAllProducts()).not.toThrow();
  });

  it("gives every product a unique slug", () => {
    const slugs = loadAllProducts().map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves a known slug", () => {
    expect(loadProduct("sle-6013")?.name).toBe("SLE-6013");
  });

  it("round-trips a minimal valid document through the schema", () => {
    const result = ProductSchema.safeParse({
      slug: "sle-6013",
      name: "SLE-6013",
      family: "mild-steel",
      process: "SMAW",
      tagline: "All-purpose mild steel electrode",
      classification: { aws: "E6013", en_iso: null, is: null },
      coating: { type: "Rutile (Titania) Coated", description: null },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a chemistry entry with no values", () => {
    const result = ProductSchema.safeParse({
      slug: "x",
      name: "X",
      family: "mild-steel",
      process: "SMAW",
      tagline: "t",
      classification: { aws: "E6013", en_iso: null, is: null },
      coating: { type: null, description: null },
      chemistry: [{ element: "C", min: null, max: null, typical: null }],
    });
    expect(result.success).toBe(false);
  });
});
