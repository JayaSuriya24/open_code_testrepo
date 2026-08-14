import type { Product } from "./schema.ts";

export interface LookupCriteria {
  aws?: string[] | undefined;
  families?: string[] | undefined;
  diametersMm?: number[] | undefined;
  positions?: string[] | undefined;
  currentTypes?: string[] | undefined;
  minTensileMpa?: number | undefined;
  minElongationPct?: number | undefined;
  chemistryMax?: { element: string; max: number } | undefined;
}

function hasDiameter(product: Product, diameterMm: number): boolean {
  return product.sizes.some((size) => size.diameter_mm === diameterMm);
}

function matchesAws(product: Product, codes: string[]): boolean {
  const aws = product.classification.aws.toUpperCase();
  return codes.some((code) => aws.includes(code.toUpperCase()));
}

function matchesChemistryMax(
  product: Product,
  criteria: { element: string; max: number },
): boolean {
  const entry = product.chemistry.find(
    (entry) => entry.element.toUpperCase() === criteria.element.toUpperCase(),
  );
  // Fail closed: an element with no declared max cannot be confirmed to meet
  // a ceiling, so it is treated as a non-match.
  return entry?.max !== null && entry?.max !== undefined && entry.max <= criteria.max;
}

export function filterProducts(products: Product[], criteria: LookupCriteria): Product[] {
  return products.filter((product) => {
    if (criteria.aws && !matchesAws(product, criteria.aws)) return false;
    if (criteria.families && !criteria.families.includes(product.family)) return false;
    if (criteria.diametersMm && !criteria.diametersMm.some((diameter) => hasDiameter(product, diameter)))
      return false;
    if (
      criteria.positions &&
      !criteria.positions.some((position) => product.positions.some((p) => p === position))
    )
      return false;
    if (
      criteria.currentTypes &&
      !criteria.currentTypes.some((current) => product.current_types.some((c) => c === current))
    )
      return false;
    if (
      criteria.minTensileMpa !== undefined &&
      (product.mechanical.tensile_min_mpa === null ||
        product.mechanical.tensile_min_mpa < criteria.minTensileMpa)
    )
      return false;
    if (
      criteria.minElongationPct !== undefined &&
      (product.mechanical.elongation_min_pct === null ||
        product.mechanical.elongation_min_pct < criteria.minElongationPct)
    )
      return false;
    if (criteria.chemistryMax && !matchesChemistryMax(product, criteria.chemistryMax)) return false;
    return true;
  });
}
