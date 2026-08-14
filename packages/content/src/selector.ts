export const BASE_MATERIALS = [
  "carbon-steel",
  "low-alloy-steel",
  "stainless-austenitic",
  "stainless-dissimilar",
  "hard-facing",
] as const;
export type BaseMaterial = (typeof BASE_MATERIALS)[number];

export const CARBON_JOBS = ["general", "structural-critical", "high-deposition"] as const;
export type CarbonJob = (typeof CARBON_JOBS)[number];

export interface SelectorInput {
  baseMaterial: BaseMaterial;
  carbonJob?: CarbonJob;
}

export type SelectorOutcome =
  | { kind: "match"; slug: string; note: string }
  | { kind: "no-match"; reason: string };

export function recommend(input: SelectorInput): SelectorOutcome {
  switch (input.baseMaterial) {
    case "carbon-steel":
      switch (input.carbonJob) {
        case "general":
          return {
            kind: "match",
            slug: "sle-6013",
            note: "An all-position rutile electrode — a strong starting point for general fabrication on light and medium plate.",
          };
        case "structural-critical":
          return {
            kind: "match",
            slug: "sle-7018",
            note: "Low-hydrogen deposit for joints that carry load or where the material is prone to hydrogen cracking.",
          };
        case "high-deposition":
          return {
            kind: "match",
            slug: "sle-7024",
            note: "Iron-powder electrode built for flat and horizontal-down joints where deposition rate matters.",
          };
        default:
          return {
            kind: "no-match",
            reason: "Tell us the joint and service condition for a recommendation.",
          };
      }
    case "low-alloy-steel":
      return {
        kind: "no-match",
        reason: "The current range does not declare a low-alloy grade. Ask our technical team for a candidate.",
      };
    case "stainless-austenitic":
      return {
        kind: "match",
        slug: "sle-308l",
        note: "For austenitic stainless base metal such as 304 and 321 — the weld metal is 308L.",
      };
    case "stainless-dissimilar":
      return {
        kind: "match",
        slug: "sle-309",
        note: "For joining stainless to carbon steel, and as a buttering layer on carbon steel.",
      };
    case "hard-facing":
      return {
        kind: "match",
        slug: "sle-hard",
        note: "For surfaces subject to abrasion, impact or wear, built up before re-service.",
      };
  }
}
