import { z } from "zod";

export const rfqItemSchema = z.object({
  slug: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(1_000_000),
});

export const rfqSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional(),
  email: z.email().max(254),
  phone: z.string().trim().max(30).optional(),
  items: z.array(rfqItemSchema).min(1).max(20),
  message: z.string().trim().max(2000).optional(),
  source: z.enum(["product", "page"]).default("page"),
});

export type RfqPayload = z.infer<typeof rfqSchema>;
export type RfqItem = z.infer<typeof rfqItemSchema>;
