import { readFileSync, readdirSync } from "node:fs";
import { parseProducts } from "./parse.ts";
import type { Product } from "./schema.ts";
import { filterProducts } from "./search.ts";
import { lookupCriteriaSchema } from "./search-schema.ts";

export type { Product, Size } from "./schema.ts";
export { filterProducts, lookupCriteriaSchema };
export type { LookupCriteria, LookupCriteriaInput } from "./search-schema.ts";

const PRODUCTS_URL = new URL("../products/", import.meta.url);

export function loadAllProducts(): Product[] {
  const files = readdirSync(PRODUCTS_URL).filter((file) => file.endsWith(".yaml"));
  const sources = files.map((file) => ({
    file: `products/${file}`,
    raw: readFileSync(new URL(file, PRODUCTS_URL), "utf8"),
  }));
  return parseProducts(sources);
}

export function loadProduct(slug: string): Product | undefined {
  return loadAllProducts().find((product) => product.slug === slug);
}
