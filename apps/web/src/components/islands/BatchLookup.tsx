import { useState } from "preact/hooks";
import { filterProducts, type LookupCriteria } from "@se/content/search";
import type { Product } from "@se/content/raw";

interface Props {
  products: Product[];
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export default function BatchLookup({ products }: Props) {
  const diameters = uniqueSorted(products.flatMap((product) => product.sizes.map((size) => String(size.diameter_mm))));
  const families = uniqueSorted(products.map((product) => product.family));
  const elements = uniqueSorted(products.flatMap((product) => product.chemistry.map((entry) => entry.element)));

  const [aws, setAws] = useState("");
  const [family, setFamily] = useState("");
  const [diameter, setDiameter] = useState("");
  const [minTensile, setMinTensile] = useState("");
  const [minElongation, setMinElongation] = useState("");
  const [element, setElement] = useState("");
  const [elementMax, setElementMax] = useState("");

  const awsCodes = aws
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

  const criteria: LookupCriteria = {
    ...(awsCodes.length > 0 ? { aws: awsCodes } : {}),
    ...(family ? { families: [family] } : {}),
    ...(diameter ? { diametersMm: [Number(diameter)] } : {}),
    ...(minTensile ? { minTensileMpa: Number(minTensile) } : {}),
    ...(minElongation ? { minElongationPct: Number(minElongation) } : {}),
    ...(element && elementMax ? { chemistryMax: { element, max: Number(elementMax) } } : {}),
  };

  const filtered = filterProducts(products, criteria);

  const hasUnknownMechanical =
    criteria.minTensileMpa !== undefined || criteria.minElongationPct !== undefined;

  return (
    <section class="batch" aria-label="Batch specification lookup">
      <form class="batch__form" onSubmit={(event) => event.preventDefault()}>
        <div class="batch__grid">
          <label class="batch__field batch__field--wide">
            <span class="batch__label">AWS class (comma-separated, e.g. E7018, E6013-1)</span>
            <input
              type="text"
              value={aws}
              onInput={(event) => setAws(event.currentTarget.value)}
              placeholder="E7018, E308L-16"
              autocomplete="off"
            />
          </label>

          <label class="batch__field">
            <span class="batch__label">Alloy family</span>
            <select value={family} onChange={(event) => setFamily(event.currentTarget.value)}>
              <option value="">Any</option>
              {families.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label class="batch__field">
            <span class="batch__label">Diameter (mm)</span>
            <select value={diameter} onChange={(event) => setDiameter(event.currentTarget.value)}>
              <option value="">Any</option>
              {diameters.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label class="batch__field">
            <span class="batch__label">Min tensile (MPa)</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="2000"
              value={minTensile}
              onInput={(event) => setMinTensile(event.currentTarget.value)}
              placeholder="e.g. 480"
            />
          </label>

          <label class="batch__field">
            <span class="batch__label">Min elongation (%)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.1"
              max="100"
              step="0.1"
              value={minElongation}
              onInput={(event) => setMinElongation(event.currentTarget.value)}
              placeholder="e.g. 20"
            />
          </label>

          <label class="batch__field">
            <span class="batch__label">Chemistry — element</span>
            <select value={element} onChange={(event) => setElement(event.currentTarget.value)}>
              <option value="">Any</option>
              {elements.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label class="batch__field">
            <span class="batch__label">Max content (%)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.001"
              max="50"
              step="0.001"
              value={elementMax}
              onInput={(event) => setElementMax(event.currentTarget.value)}
              placeholder="e.g. 0.05"
              disabled={element === ""}
            />
          </label>
        </div>
      </form>

      <p class="batch__note">
        {hasUnknownMechanical && (
          <span>
            The catalogue does not yet declare tensile or elongation for any grade, so those
            filters match nothing until the values are published.
          </span>
        )}
        {!hasUnknownMechanical && (
          <span>Results update as you type. Empty criteria list the full range.</span>
        )}
      </p>

      <p class="batch__count" aria-live="polite">
        {filtered.length} of {products.length} products
      </p>

      <ul class="batch__results">
        {filtered.map((product) => (
          <li class="batch-card">
            <a class="batch-card__link" href={`/products/${product.slug}`}>
              <span class="batch-card__name">{product.name}</span>
              <code class="batch-card__class tabular">{product.classification.aws}</code>
              <span class="batch-card__meta">
                {product.classification.is ?? "IS pending"} ·{" "}
                {product.sizes.map((size) => size.diameter_mm).join(", ")} mm
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
