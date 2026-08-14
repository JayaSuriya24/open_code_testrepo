import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { ProductSchema, type Product } from "./schema.ts";

const PRODUCTS_URL = new URL("../products/", import.meta.url);

export function loadAllProducts(): Product[] {
  const files = readdirSync(PRODUCTS_URL).filter((file) => file.endsWith(".yaml"));
  const products: Product[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const raw = readFileSync(new URL(file, PRODUCTS_URL), "utf8");
    const parsed = parse(raw);
    const result = ProductSchema.safeParse(parsed);
    if (result.success) {
      products.push(result.data);
    } else {
      errors.push(`products/${file}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`content validation failed\n${errors.join("\n")}`);
  }

  return products;
}

export function loadProduct(slug: string): Product | undefined {
  return loadAllProducts().find((product) => product.slug === slug);
}
