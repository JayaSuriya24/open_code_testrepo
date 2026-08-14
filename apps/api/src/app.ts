import { randomUUID } from "node:crypto";
import { filterProducts, loadAllProducts, loadProduct, lookupCriteriaSchema } from "@se/content";
import { pingDb, rfqItems, rfqs, type Db } from "@se/db";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "./env.ts";
import { buildRfqMessage, resolveItems } from "./rfq/email.ts";
import type { Mailer } from "./rfq/mailer.ts";
import type { RateLimiter } from "./rfq/rate-limit.ts";
import { rfqSchema, type RfqPayload } from "./rfq/schema.ts";

type RfqId = `${string}-${string}-${string}-${string}-${string}`;

export interface AppDeps {
  config: Env;
  mailer: Mailer;
  limiter: RateLimiter;
  db: Db | undefined;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  app.use("/api/*", cors({ origin: deps.config.appUrl }));

  app.onError((error, c) => {
    console.error(
      JSON.stringify({
        event: "api.error",
        method: c.req.method,
        path: c.req.path,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      }),
    );
    return c.json({ ok: false, error: "Internal server error." }, 500);
  });

  app.get("/health", async (c) => {
    let db: "not-configured" | "ok" | "error" = "not-configured";
    if (deps.db) {
      db = (await pingDb(deps.db)) ? "ok" : "error";
    }
    if (db === "error") {
      return c.json({ ok: false, service: "sunline-endeavour-api", db }, 503);
    }
    return c.json({ ok: true, service: "sunline-endeavour-api", db });
  });

  app.post("/api/rfq", async (c) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!deps.limiter.allow(ip)) {
      return c.json({ ok: false, error: "Too many requests. Please try again later." }, 429);
    }

    let payload: RfqPayload;
    try {
      payload = rfqSchema.parse(await c.req.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ ok: false, errors: error.flatten().fieldErrors }, 400);
      }
      return c.json({ ok: false, error: "Invalid JSON body." }, 400);
    }

    const { resolved, missing } = resolveItems(payload, loadProduct);
    if (missing.length > 0) {
      return c.json(
        { ok: false, errors: { items: [`Unknown SKU: ${missing.join(", ")}`] } },
        400,
      );
    }
    if (resolved.length === 0) {
      return c.json({ ok: false, errors: { items: ["No valid items requested."] } }, 400);
    }

    const message = buildRfqMessage({
      payload,
      resolved,
      from: deps.config.mailboxes.from,
      to: deps.config.mailboxes.to,
      appUrl: deps.config.appUrl,
    });

    let id: RfqId = randomUUID() as RfqId;
    if (deps.db) {
      try {
        const inserted = await deps.db
          .insert(rfqs)
          .values({
            name: payload.name,
            company: payload.company,
            email: payload.email,
            phone: payload.phone,
            message: payload.message,
            source: payload.source,
            ip,
          })
          .returning({ id: rfqs.id });
        const persistedId = inserted[0]?.id;
        if (persistedId) {
          id = persistedId as RfqId;
          await deps.db.insert(rfqItems).values(
            resolved.map((item, index) => ({
              rfqId: id,
              slug: item.slug,
              name: item.name,
              aws: item.aws,
              quantity: item.quantity,
              position: index,
            })),
          );
        }
      } catch (error) {
        console.error("[rfq] persistence failed, continuing by email only", error);
      }
    }

    try {
      await deps.mailer.send(message);
    } catch (error) {
      console.error("[rfq] mailer failed", error);
      return c.json({ ok: false, error: "Could not send the request." }, 500);
    }

    return c.json(
      {
        ok: true,
        id,
        items: resolved.map((item) => ({ ...item })),
      },
      201,
    );
  });

  app.post("/api/lookup", async (c) => {
    let criteria;
    try {
      criteria = lookupCriteriaSchema.parse(await c.req.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ ok: false, errors: error.flatten().fieldErrors }, 400);
      }
      return c.json({ ok: false, error: "Invalid JSON body." }, 400);
    }

    if (Object.keys(criteria).length === 0) {
      return c.json({ ok: false, errors: { criteria: ["At least one criterion is required."] } }, 400);
    }

    const results = filterProducts(loadAllProducts(), criteria).map((product) => ({
      slug: product.slug,
      name: product.name,
      family: product.family,
      aws: product.classification.aws,
      is: product.classification.is,
      en_iso: product.classification.en_iso,
      diametersMm: product.sizes.map((size) => size.diameter_mm),
      tensileMinMpa: product.mechanical.tensile_min_mpa,
      elongationMinPct: product.mechanical.elongation_min_pct,
    }));

    return c.json({ ok: true, count: results.length, results }, 200);
  });

  return app;
}
