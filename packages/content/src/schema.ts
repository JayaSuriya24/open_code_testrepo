import { z } from "zod";

export const POSITION_CODES = ["1", "2", "3", "4", "5", "6"] as const;
export const CURRENT_TYPES = ["AC", "DC+", "DC-", "AC_DC+"] as const;
export const ALLOY_FAMILIES = [
  "mild-steel",
  "low-alloy",
  "stainless-austenitic",
  "stainless-dissimilar",
  "high-deposition",
  "hard-facing",
] as const;
export const PROCESSES = ["SMAW", "GMAW", "FCAW", "SAW"] as const;

export const PositionCode = z.enum(POSITION_CODES);
export const CurrentType = z.enum(CURRENT_TYPES);
export const AlloyFamily = z.enum(ALLOY_FAMILIES);
export const Process = z.enum(PROCESSES);

export const ClassificationSchema = z.object({
  aws: z.string(),
  en_iso: z.string().nullable(),
  is: z.string().nullable(),
});

export const ChemistryEntrySchema = z
  .object({
    element: z.string(),
    min: z.number().nullable(),
    max: z.number().nullable(),
    typical: z.number().nullable(),
  })
  .superRefine((entry, ctx) => {
    if (entry.min === null && entry.max === null && entry.typical === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `chemistry entry ${entry.element} needs at least one of min/max/typical`,
      });
    }
    if (entry.min !== null && entry.max !== null && entry.max < entry.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `chemistry entry ${entry.element} has max < min`,
      });
    }
  });

export const ImpactEntrySchema = z.object({
  temperature_c: z.number().nullable(),
  min_joules: z.number().nullable(),
});

export const MechanicalSchema = z.object({
  tensile_min_mpa: z.number().nullable().default(null),
  yield_min_mpa: z.number().nullable().default(null),
  elongation_min_pct: z.number().nullable().default(null),
  impact: z.array(ImpactEntrySchema).default([]),
});

export const RedrySchema = z.object({
  temperature_c: z.number().nullable(),
  duration_h: z.number().nullable(),
  note: z.string().nullable(),
});

export const SizeSchema = z.object({
  diameter_mm: z.number().positive(),
  length_mm: z.number().positive().nullable(),
  amperage_min: z.number().positive().nullable(),
  amperage_max: z.number().positive().nullable(),
  pieces_per_packet: z.number().positive().int().nullable(),
  kg_per_carton: z.number().positive().nullable(),
});

export const PackingSchema = z.object({
  pieces_per_carton: z.number().positive().int().nullable(),
  cartons_per_box: z.number().positive().int().nullable(),
});

export const EquivalentSchema = z.object({
  brand: z.string(),
  code: z.string(),
});

export const CoatingSchema = z.object({
  type: z.string().nullable(),
  description: z.string().nullable(),
});

export const ProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  name: z.string(),
  family: AlloyFamily,
  process: Process,
  tagline: z.string(),
  classification: ClassificationSchema,
  coating: CoatingSchema,
  current_types: z.array(CurrentType).default([]),
  positions: z.array(PositionCode).default([]),
  redry: RedrySchema.nullable().default(null),
  packing: PackingSchema.nullable().default(null),
  chemistry: z.array(ChemistryEntrySchema).default([]),
  mechanical: MechanicalSchema.default(MechanicalSchema.parse({})),
  sizes: z.array(SizeSchema).default([]),
  applications: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  datasheet: z.string().nullable().default(null),
  msds: z.string().nullable().default(null),
  equivalents: z.array(EquivalentSchema).default([]),
});

export type Product = z.infer<typeof ProductSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type ChemistryEntry = z.infer<typeof ChemistryEntrySchema>;
