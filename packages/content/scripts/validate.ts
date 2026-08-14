import { loadAllProducts } from "../src/index.ts";

function countNulls(value: unknown): number {
  if (value === null) {
    return 1;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((acc, item) => acc + countNulls(item), 0);
  }
  if (typeof value === "object") {
    return Object.values(value).reduce<number>((acc, item) => acc + countNulls(item), 0);
  }
  return 0;
}

try {
  const products = loadAllProducts();
  const nullCount = products.reduce((acc, product) => acc + countNulls(product), 0);
  console.log(
    `content:validate OK — ${products.length} products, ${nullCount} null fields (see MISSING-DATA.md)`,
  );
  process.exitCode = 0;
} catch (error) {
  console.error("content:validate FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
