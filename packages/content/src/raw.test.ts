import { describe, expect, it } from "vitest";
import { loadAllProducts, loadProduct } from "./raw.ts";

describe("raw content layer", () => {
  it("loads and validates every product YAML inlined via ?raw", () => {
    const products = loadAllProducts();
    expect(products.length).toBe(6);
  });

  it("matches the filesystem loader output", async () => {
    const { loadAllProducts: loadFromFs } = await import("./index.ts");
    expect(loadAllProducts()).toEqual(loadFromFs());
  });

  it("resolves a known slug", () => {
    expect(loadProduct("sle-6013")?.name).toBe("SLE-6013");
  });
});
