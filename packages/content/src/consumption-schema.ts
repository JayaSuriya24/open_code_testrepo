import { z } from "zod";
import { PROCESSES } from "./schema.ts";

const length = z.coerce.number().positive().max(10000);
const density = z.coerce.number().positive().max(30);
const grooveBase = {
  thicknessMm: z.coerce.number().positive().max(500),
  grooveAngleDeg: z.coerce.number().positive().min(10).max(120),
  rootGapMm: z.coerce.number().nonnegative().max(20),
  rootFaceMm: z.coerce.number().nonnegative().max(100),
};

export const consumptionJointSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("fillet"),
    filletLegMm: z.coerce.number().positive().max(200),
  }),
  z
    .object({ type: z.literal("v"), ...grooveBase })
    .refine((input) => input.thicknessMm > input.rootFaceMm, {
      message: "Root face must be less than plate thickness",
      path: ["rootFaceMm"],
    }),
  z
    .object({ type: z.literal("x"), ...grooveBase })
    .refine((input) => input.thicknessMm > input.rootFaceMm, {
      message: "Root face must be less than plate thickness",
      path: ["rootFaceMm"],
    }),
  z
    .object({ type: z.literal("k"), ...grooveBase })
    .refine((input) => input.thicknessMm > input.rootFaceMm, {
      message: "Root face must be less than plate thickness",
      path: ["rootFaceMm"],
    }),
  z
    .object({
      type: z.literal("u"),
      thicknessMm: grooveBase.thicknessMm,
      rootGapMm: grooveBase.rootGapMm,
      rootFaceMm: grooveBase.rootFaceMm,
      rootRadiusMm: z.coerce.number().positive().max(100),
    })
    .refine((input) => input.thicknessMm > input.rootFaceMm, {
      message: "Root face must be less than plate thickness",
      path: ["rootFaceMm"],
    })
    .refine((input) => input.thicknessMm - input.rootFaceMm > input.rootRadiusMm, {
      message: "Root radius must be less than the groove depth",
      path: ["rootRadiusMm"],
    }),
]);

export const consumptionEstimateSchema = z.object({
  joint: consumptionJointSchema,
  lengthM: length,
  process: z.enum(PROCESSES).default("SMAW"),
  densityGPerCm3: density,
});

export type ConsumptionJointInput = z.infer<typeof consumptionJointSchema>;
export type ConsumptionEstimateInput = z.infer<typeof consumptionEstimateSchema>;
