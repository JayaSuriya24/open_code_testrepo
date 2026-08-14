import { z } from "zod";
import type { LookupCriteria } from "./search.ts";

export const lookupCriteriaSchema = z.object({
  aws: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  families: z.array(z.string().min(1).max(40)).max(10).optional(),
  diametersMm: z.array(z.coerce.number().positive().max(20)).max(20).optional(),
  positions: z.array(z.string().min(1).max(2)).max(10).optional(),
  currentTypes: z.array(z.string().min(1).max(10)).max(10).optional(),
  minTensileMpa: z.coerce.number().int().min(1).max(2000).optional(),
  minElongationPct: z.coerce.number().min(0.1).max(100).optional(),
  chemistryMax: z
    .object({
      element: z.string().trim().min(1).max(2),
      max: z.coerce.number().positive().max(50),
    })
    .optional(),
});

export type LookupCriteriaInput = z.infer<typeof lookupCriteriaSchema>;

export type { LookupCriteria };

