import { describe, expect, it } from "vitest";
import { recommend, type BaseMaterial, type CarbonJob } from "./selector.ts";
import { loadAllProducts } from "./index.ts";

const catalogue = new Set(loadAllProducts().map((product) => product.slug));

describe("recommend", () => {
  const carbonCases: [CarbonJob, string][] = [
    ["general", "sle-6013"],
    ["structural-critical", "sle-7018"],
    ["high-deposition", "sle-7024"],
  ];

  for (const [job, slug] of carbonCases) {
    it(`carbon steel · ${job} → ${slug}`, () => {
      const outcome = recommend({ baseMaterial: "carbon-steel", carbonJob: job });
      expect(outcome.kind).toBe("match");
      if (outcome.kind === "match") {
        expect(outcome.slug).toBe(slug);
      }
    });
  }

  const directCases: [BaseMaterial, string][] = [
    ["stainless-austenitic", "sle-308l"],
    ["stainless-dissimilar", "sle-309"],
    ["hard-facing", "sle-hard"],
  ];

  for (const [material, slug] of directCases) {
    it(`${material} → ${slug}`, () => {
      const outcome = recommend({ baseMaterial: material });
      expect(outcome.kind).toBe("match");
      if (outcome.kind === "match") {
        expect(outcome.slug).toBe(slug);
      }
    });
  }

  it("low-alloy steel fails closed with a no-match", () => {
    const outcome = recommend({ baseMaterial: "low-alloy-steel" });
    expect(outcome.kind).toBe("no-match");
    if (outcome.kind === "no-match") {
      expect(outcome.reason.length).toBeGreaterThan(0);
    }
  });

  it("carbon steel without a job fails closed", () => {
    const outcome = recommend({ baseMaterial: "carbon-steel" });
    expect(outcome.kind).toBe("no-match");
  });

  it("every recommended slug resolves in the catalogue", () => {
    const materials: BaseMaterial[] = [
      "carbon-steel",
      "low-alloy-steel",
      "stainless-austenitic",
      "stainless-dissimilar",
      "hard-facing",
    ];
    const jobs: (CarbonJob | undefined)[] = ["general", "structural-critical", "high-deposition", undefined];
    for (const material of materials) {
      for (const job of jobs) {
        const outcome = recommend({ baseMaterial: material, ...(job ? { carbonJob: job } : {}) });
        if (outcome.kind === "match") {
          expect(catalogue.has(outcome.slug), `${outcome.slug} must exist in products/`).toBe(true);
        }
      }
    }
  });
});
