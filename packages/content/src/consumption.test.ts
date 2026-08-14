import { describe, expect, it } from "vitest";
import {
  DENSITY_G_PER_CM3_BY_FAMILY,
  DEPOSITION_EFFICIENCY,
  densityGPerCm3ForFamily,
  electrodeKg,
  estimateConsumption,
  weldAreaMm2,
  weldMetalKg,
  type JointInput,
} from "./consumption.ts";
import { consumptionEstimateSchema, consumptionJointSchema } from "./consumption-schema.ts";

describe("weldAreaMm2", () => {
  it("fillet weld area is half the leg squared", () => {
    expect(weldAreaMm2({ type: "fillet", filletLegMm: 8 })).toBeCloseTo(32, 10);
  });

  it("single-V area = h^2 tan(angle/2) + h * gap", () => {
    const joint: JointInput = { type: "v", thicknessMm: 12, grooveAngleDeg: 60, rootGapMm: 2, rootFaceMm: 2 };
    expect(weldAreaMm2(joint)).toBeCloseTo(77.73502691896257, 9);
  });

  it("double-V (X) area is half the single-V taper plus the full gap rectangle", () => {
    const joint: JointInput = { type: "x", thicknessMm: 20, grooveAngleDeg: 50, rootGapMm: 3, rootFaceMm: 3 };
    expect(weldAreaMm2(joint)).toBeCloseTo(118.3814566033973, 9);
  });

  it("K (double bevel) area is a quarter of the single-V taper plus the full gap rectangle", () => {
    const joint: JointInput = { type: "k", thicknessMm: 25, grooveAngleDeg: 45, rootGapMm: 2, rootFaceMm: 3 };
    expect(weldAreaMm2(joint)).toBeCloseTo(94.11984104714449, 9);
  });

  it("U-groove area = gap*(depth - radius) + half circle of the root radius", () => {
    const joint: JointInput = { type: "u", thicknessMm: 16, rootGapMm: 2, rootFaceMm: 3, rootRadiusMm: 4 };
    expect(weldAreaMm2(joint)).toBeCloseTo(43.132741228718345, 9);
  });
});

describe("estimateConsumption — hand-worked verification", () => {
  it("fillet, 8 mm leg, 1 m, mild steel (7.8), SMAW", () => {
    const result = estimateConsumption({
      joint: { type: "fillet", filletLegMm: 8 },
      lengthM: 1,
      process: "SMAW",
      densityGPerCm3: 7.8,
    });
    expect(result.weldAreaMm2).toBeCloseTo(32, 9);
    expect(result.weldMetalKg).toBeCloseTo(0.2496, 9);
    expect(result.electrodeKg).toBeCloseTo(0.3565714285714286, 9);
  });

  it("single V, 12 mm plate, 60°, 1 m, mild steel, SMAW", () => {
    const result = estimateConsumption({
      joint: { type: "v", thicknessMm: 12, grooveAngleDeg: 60, rootGapMm: 2, rootFaceMm: 2 },
      lengthM: 1,
      process: "SMAW",
      densityGPerCm3: 7.8,
    });
    expect(result.weldMetalKg).toBeCloseTo(0.6063332099679081, 9);
    expect(result.electrodeKg).toBeCloseTo(0.8661902999541544, 9);
  });

  it("double V, 20 mm plate, 50°, 5 m, mild steel, SMAW", () => {
    const result = estimateConsumption({
      joint: { type: "x", thicknessMm: 20, grooveAngleDeg: 50, rootGapMm: 3, rootFaceMm: 3 },
      lengthM: 5,
      process: "SMAW",
      densityGPerCm3: 7.8,
    });
    expect(result.weldMetalKg).toBeCloseTo(4.6168768075324955, 9);
    expect(result.electrodeKg).toBeCloseTo(6.595538296474994, 9);
  });

  it("K, 25 mm plate, 45°, 3 m, mild steel, SAW", () => {
    const result = estimateConsumption({
      joint: { type: "k", thicknessMm: 25, grooveAngleDeg: 45, rootGapMm: 2, rootFaceMm: 3 },
      lengthM: 3,
      process: "SAW",
      densityGPerCm3: 7.8,
    });
    expect(result.weldMetalKg).toBeCloseTo(2.2024042805031807, 9);
    expect(result.electrodeKg).toBeCloseTo(2.2473513066358985, 9);
  });

  it("U, 16 mm plate, 2 m, stainless (7.9), FCAW", () => {
    const result = estimateConsumption({
      joint: { type: "u", thicknessMm: 16, rootGapMm: 2, rootFaceMm: 3, rootRadiusMm: 4 },
      lengthM: 2,
      process: "FCAW",
      densityGPerCm3: 7.9,
    });
    expect(result.weldMetalKg).toBeCloseTo(0.6814973114137499, 9);
    expect(result.electrodeKg).toBeCloseTo(0.7833302430043102, 9);
  });
});

describe("derived helpers", () => {
  it("scales linearly with weld length", () => {
    expect(weldMetalKg({ type: "fillet", filletLegMm: 8 }, 10, 7.8)).toBeCloseTo(
      weldMetalKg({ type: "fillet", filletLegMm: 8 }, 1, 7.8) * 10,
      9,
    );
  });

  it("divides by the process deposition efficiency", () => {
    expect(electrodeKg(1, "SMAW")).toBeCloseTo(1 / 0.7, 9);
    expect(electrodeKg(1, "FCAW")).toBeCloseTo(1 / 0.87, 9);
  });
});

describe("constants", () => {
  it("deposition efficiency per plan §2.6", () => {
    expect(DEPOSITION_EFFICIENCY.SMAW).toBeCloseTo(0.7, 9);
    expect(DEPOSITION_EFFICIENCY.FCAW).toBeCloseTo(0.87, 9);
    expect(DEPOSITION_EFFICIENCY.GMAW).toBeCloseTo(0.98, 9);
    expect(DEPOSITION_EFFICIENCY.SAW).toBeCloseTo(0.98, 9);
  });

  it("weld-metal density per plan §2.6", () => {
    expect(DENSITY_G_PER_CM3_BY_FAMILY["mild-steel"]).toBeCloseTo(7.8, 9);
    expect(DENSITY_G_PER_CM3_BY_FAMILY["low-alloy"]).toBeCloseTo(7.8, 9);
    expect(DENSITY_G_PER_CM3_BY_FAMILY["high-deposition"]).toBeCloseTo(7.8, 9);
    expect(DENSITY_G_PER_CM3_BY_FAMILY["stainless-austenitic"]).toBeCloseTo(7.9, 9);
    expect(DENSITY_G_PER_CM3_BY_FAMILY["stainless-dissimilar"]).toBeCloseTo(7.9, 9);
    expect(densityGPerCm3ForFamily("hard-facing")).toBeUndefined();
  });
});

describe("consumptionEstimateSchema", () => {
  it("accepts a valid fillet estimate and defaults the process to SMAW", () => {
    const result = consumptionEstimateSchema.safeParse({
      joint: { type: "fillet", filletLegMm: 8 },
      lengthM: 1,
      densityGPerCm3: 7.8,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.process).toBe("SMAW");
    }
  });

  it("rejects a root face equal to or above plate thickness", () => {
    const result = consumptionJointSchema.safeParse({
      type: "v",
      thicknessMm: 10,
      grooveAngleDeg: 60,
      rootGapMm: 2,
      rootFaceMm: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a root radius deeper than the groove", () => {
    const result = consumptionJointSchema.safeParse({
      type: "u",
      thicknessMm: 10,
      rootGapMm: 2,
      rootFaceMm: 2,
      rootRadiusMm: 9,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero density and non-positive lengths", () => {
    expect(
      consumptionEstimateSchema.safeParse({ joint: { type: "fillet", filletLegMm: 8 }, lengthM: 0, densityGPerCm3: 7.8 })
        .success,
    ).toBe(false);
    expect(
      consumptionEstimateSchema.safeParse({ joint: { type: "fillet", filletLegMm: 8 }, lengthM: 1, densityGPerCm3: 0 })
        .success,
    ).toBe(false);
  });
});
