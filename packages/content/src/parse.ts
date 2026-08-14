import { parse } from "yaml";
import { ProductSchema, type Product } from "./schema.ts";

export function parseProducts(sources: { file: string; raw: string }[]): Product[] {
  const products: Product[] = [];
  const errors: string[] = [];

  for (const { file, raw } of sources) {
    const result = ProductSchema.safeParse(parse(raw));
    if (result.success) {
      products.push(result.data);
    } else {
      errors.push(`${file}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`content validation failed\n${errors.join("\n")}`);
  }

  return products.sort((a, b) => a.slug.localeCompare(b.slug));
}
