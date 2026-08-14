import type { Product } from "@se/content/raw";

export interface QueryPrefill {
  slugs: string[];
  qty: number;
  note: string;
}

export function readQueryPrefill(products: Product[], search: string): QueryPrefill | null {
  const params = new URLSearchParams(search);
  const slugs = (params.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug) => products.some((product) => product.slug === slug));
  if (slugs.length === 0) return null;
  const parsedQty = Number(params.get("qty"));
  const qty = Number.isInteger(parsedQty) && parsedQty >= 1 && parsedQty <= 1_000_000 ? parsedQty : 1;
  return { slugs, qty, note: (params.get("note") ?? "").slice(0, 2000) };
}
