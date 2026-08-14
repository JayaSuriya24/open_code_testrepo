import type { AlloyFamily, Process } from "./schema.ts";

export const JOINT_TYPES = ["fillet", "v", "x", "k", "u"] as const;
export type JointType = (typeof JOINT_TYPES)[number];

export const DEPOSITION_EFFICIENCY = {
  SMAW: 0.7,
  GMAW: 0.98,
  FCAW: 0.87,
  SAW: 0.98,
} as const satisfies Record<Process, number>;

export const DENSITY_G_PER_CM3_BY_FAMILY: Readonly<Partial<Record<AlloyFamily, number>>> = {
  "mild-steel": 7.8,
  "low-alloy": 7.8,
  "stainless-austenitic": 7.9,
  "stainless-dissimilar": 7.9,
  "high-deposition": 7.8,
};

export type JointInput =
  | { type: "fillet"; filletLegMm: number }
  | { type: "v"; thicknessMm: number; grooveAngleDeg: number; rootGapMm: number; rootFaceMm: number }
  | { type: "x"; thicknessMm: number; grooveAngleDeg: number; rootGapMm: number; rootFaceMm: number }
  | { type: "k"; thicknessMm: number; grooveAngleDeg: number; rootGapMm: number; rootFaceMm: number }
  | { type: "u"; thicknessMm: number; rootGapMm: number; rootFaceMm: number; rootRadiusMm: number };

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function weldAreaMm2(joint: JointInput): number {
  switch (joint.type) {
    case "fillet":
      return (joint.filletLegMm * joint.filletLegMm) / 2;
    case "v":
    case "x":
    case "k": {
      const depth = joint.thicknessMm - joint.rootFaceMm;
      const taper = depth * depth * Math.tan(degToRad(joint.grooveAngleDeg / 2));
      const factor = joint.type === "v" ? 1 : joint.type === "x" ? 0.5 : 0.25;
      return taper * factor + depth * joint.rootGapMm;
    }
    case "u": {
      const depth = joint.thicknessMm - joint.rootFaceMm;
      const radius = joint.rootRadiusMm;
      return joint.rootGapMm * (depth - radius) + (Math.PI * radius * radius) / 2;
    }
  }
}

export function weldMetalKg(joint: JointInput, lengthM: number, densityGPerCm3: number): number {
  return (weldAreaMm2(joint) * lengthM * densityGPerCm3) / 1000;
}

export function electrodeKg(weldMetalMassKg: number, process: Process): number {
  return weldMetalMassKg / DEPOSITION_EFFICIENCY[process];
}

export interface ConsumptionResult {
  weldAreaMm2: number;
  weldMetalKg: number;
  electrodeKg: number;
}

export function estimateConsumption(input: {
  joint: JointInput;
  lengthM: number;
  process: Process;
  densityGPerCm3: number;
}): ConsumptionResult {
  const weldMass = weldMetalKg(input.joint, input.lengthM, input.densityGPerCm3);
  return {
    weldAreaMm2: weldAreaMm2(input.joint),
    weldMetalKg: weldMass,
    electrodeKg: electrodeKg(weldMass, input.process),
  };
}

export function densityGPerCm3ForFamily(family: AlloyFamily): number | undefined {
  return DENSITY_G_PER_CM3_BY_FAMILY[family];
}
