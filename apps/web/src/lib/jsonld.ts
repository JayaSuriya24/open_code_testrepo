import type { Product } from "@se/content/raw";

const BRAND = "Sunline Endeavour";

function siteBase(url: URL | undefined): string {
  const root = url ?? new URL("http://localhost:4321/");
  return root.origin;
}

export function organizationJsonLd(site: URL | undefined): Record<string, unknown> {
  const base = siteBase(site);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND,
    url: base,
    logo: `${base}/assets/logo.webp`,
  };
}

export function productJsonLd(product: Product, site: URL | undefined): Record<string, unknown> {
  const base = siteBase(site);
  const properties: { name: string; value: string | number; unitCode?: string }[] = [];

  const { classification, coating, packing } = product;

  if (classification.en_iso) {
    properties.push({ name: "EN ISO classification", value: classification.en_iso });
  }
  if (classification.is) {
    properties.push({ name: "IS classification", value: classification.is });
  }
  if (coating.type) {
    properties.push({ name: "Coating", value: coating.type });
  }
  if (packing?.pieces_per_carton !== null && packing?.pieces_per_carton !== undefined) {
    properties.push({ name: "Pieces per carton", value: packing.pieces_per_carton });
  }
  if (packing?.cartons_per_box !== null && packing?.cartons_per_box !== undefined) {
    properties.push({ name: "Cartons per box", value: packing.cartons_per_box });
  }

  for (const size of product.sizes) {
    const diameter = size.diameter_mm;
    if (size.length_mm !== null) {
      properties.push({
        name: `Length, ${diameter} mm electrode`,
        value: size.length_mm,
        unitCode: "MMT",
      });
    }
    if (size.amperage_min !== null && size.amperage_max !== null) {
      properties.push({
        name: `Amperage range, ${diameter} mm`,
        value: `${size.amperage_min}–${size.amperage_max}`,
        unitCode: "AMP",
      });
    }
    if (size.pieces_per_packet !== null) {
      properties.push({ name: `Pieces per packet, ${diameter} mm`, value: size.pieces_per_packet });
    }
  }

  for (const entry of product.chemistry) {
    const range = [entry.min, entry.max, entry.typical]
      .filter((value) => value !== null)
      .join("/");
    properties.push({
      name: `${entry.element} (weld metal, wt %)`,
      value: range,
    });
  }

  const mechanical = product.mechanical;
  if (mechanical.tensile_min_mpa !== null) {
    properties.push({ name: "Min tensile strength", value: mechanical.tensile_min_mpa, unitCode: "A97" });
  }
  if (mechanical.yield_min_mpa !== null) {
    properties.push({ name: "Min yield strength", value: mechanical.yield_min_mpa, unitCode: "A97" });
  }
  if (mechanical.elongation_min_pct !== null) {
    properties.push({ name: "Min elongation", value: mechanical.elongation_min_pct, unitCode: "P1" });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.name,
    mpn: product.name,
    description: product.tagline,
    brand: { "@type": "Brand", name: BRAND },
    manufacturer: { "@type": "Organization", name: BRAND },
    url: `${base}/products/${product.slug}`,
    additionalProperty: properties,
  };
}

export function breadcrumbJsonLd(
  slug: string,
  name: string,
  site: URL | undefined,
): Record<string, unknown> {
  const base = siteBase(site);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${base}/products/` },
      { "@type": "ListItem", position: 3, name, item: `${base}/products/${slug}` },
    ],
  };
}
