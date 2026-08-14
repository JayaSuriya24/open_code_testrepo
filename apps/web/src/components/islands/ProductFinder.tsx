import { useState } from "preact/hooks";
import type { Product } from "@se/content/raw";

interface Facet {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props {
  products: Product[];
}

const FAMILY_LABELS: Record<string, string> = {
  "mild-steel": "Mild steel",
  "low-alloy": "Low alloy",
  "stainless-austenitic": "Stainless (austenitic)",
  "stainless-dissimilar": "Stainless (dissimilar)",
  "high-deposition": "High deposition",
  "hard-facing": "Hard-facing",
};

function productValues(product: Product, key: string): string[] {
  switch (key) {
    case "family":
      return [product.family];
    case "process":
      return [product.process];
    case "aws":
      return [product.classification.aws];
    case "diameter":
      return product.sizes.map((size) => String(size.diameter_mm));
    case "current_types":
      return product.current_types;
    case "positions":
      return product.positions;
    default:
      return [];
  }
}

function buildFacets(products: Product[]): Facet[] {
  const defs: { key: string; label: string }[] = [
    { key: "family", label: "Alloy family" },
    { key: "process", label: "Process" },
    { key: "aws", label: "AWS class" },
    { key: "diameter", label: "Diameter (mm)" },
    { key: "current_types", label: "Current type" },
    { key: "positions", label: "Position" },
  ];

  return defs
    .map((def) => {
      const values = Array.from(
        new Set(products.flatMap((product) => productValues(product, def.key))),
      ).sort();
      if (values.length === 0) return null;
      const options = values.map((value) => ({
        value,
        label: def.key === "family" ? (FAMILY_LABELS[value] ?? value) : value,
      }));
      return { ...def, options };
    })
    .filter((facet): facet is Facet => facet !== null);
}

export default function ProductFinder({ products }: Props) {
  const facets = buildFacets(products);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  function toggle(key: string, value: string) {
    setSelected((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function clearFilters() {
    setSelected({});
  }

  const hasFilters = Object.values(selected).some((values) => values.length > 0);

  const filtered = products.filter((product) =>
    facets.every((facet) => {
      const chosen = selected[facet.key] ?? [];
      if (chosen.length === 0) return true;
      const values = productValues(product, facet.key);
      return chosen.some((value) => values.includes(value));
    }),
  );

  return (
    <section class="finder" aria-label="Product finder">
      <div class="finder__facets">
        {facets.map((facet) => (
          <fieldset class="finder__facet">
            <legend>{facet.label}</legend>
            {facet.options.map((option) => (
              <label class="finder__option">
                <input
                  type="checkbox"
                  checked={(selected[facet.key] ?? []).includes(option.value)}
                  onChange={() => toggle(facet.key, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
        {hasFilters && (
          <button class="finder__clear" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <p class="finder__count" aria-live="polite">
        {filtered.length} of {products.length} products
      </p>

      <ul class="finder__grid">
        {filtered.map((product) => (
          <li class="finder-card">
            <a class="finder-card__link" href={`/products/${product.slug}`}>
              <span class="finder-card__name">{product.name}</span>
              <code class="finder-card__class tabular">{product.classification.aws}</code>
              <span class="finder-card__tagline">{product.tagline}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
