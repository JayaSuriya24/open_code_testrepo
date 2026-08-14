import sle6013 from "../products/sle-6013.yaml?raw";
import sle7018 from "../products/sle-7018.yaml?raw";
import sle308l from "../products/sle-308l.yaml?raw";
import sle309 from "../products/sle-309.yaml?raw";
import sle7024 from "../products/sle-7024.yaml?raw";
import sleHard from "../products/sle-hard.yaml?raw";
import { parseProducts } from "./parse.ts";
import type { Product } from "./schema.ts";

const sources = [
  { file: "products/sle-6013.yaml", raw: sle6013 },
  { file: "products/sle-7018.yaml", raw: sle7018 },
  { file: "products/sle-308l.yaml", raw: sle308l },
  { file: "products/sle-309.yaml", raw: sle309 },
  { file: "products/sle-7024.yaml", raw: sle7024 },
  { file: "products/sle-hard.yaml", raw: sleHard },
];

export function loadAllProducts(): Product[] {
  return parseProducts(sources);
}

export function loadProduct(slug: string): Product | undefined {
  return loadAllProducts().find((product) => product.slug === slug);
}
