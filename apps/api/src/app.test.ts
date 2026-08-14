import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { loadEnv } from "./env.ts";
import type { Mailer, MailMessage } from "./rfq/mailer.ts";
import { createRateLimiter } from "./rfq/rate-limit.ts";
import type { RateLimiter } from "./rfq/rate-limit.ts";

function testApp(overrides: { mailer?: Mailer; limiter?: RateLimiter } = {}) {
  const sent: MailMessage[] = [];
  const mailer: Mailer = {
    name: "test",
    send: async (message: MailMessage) => {
      sent.push(message);
    },
  };
  const config = loadEnv({
    SMTP_TO: "sales@sunlineendeavour.com",
  });
  const app = createApp({
    config,
    mailer: overrides.mailer ?? mailer,
    limiter: overrides.limiter ?? { allow: () => true },
    db: undefined,
  });
  return { app, sent };
}

describe("POST /api/rfq", () => {
  it("accepts a valid request, resolves product data and emails it", async () => {
    const { app, sent } = testApp();
    const response = await app.request("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Ravi Kumar",
        email: "ravi@example.com",
        company: "FabWorks",
        items: [{ slug: "sle-6013", quantity: 500 }],
        source: "product",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      ok: boolean;
      id: string;
      items: { slug: string; name: string; aws: string; quantity: number }[];
    };
    expect(body.ok).toBe(true);
    expect(body.id).toBeTruthy();
    expect(body.items[0]).toMatchObject({ slug: "sle-6013", aws: "E6013", quantity: 500 });

    expect(sent).toHaveLength(1);
    const mail = sent[0]!;
    expect(mail.to).toBe("sales@sunlineendeavour.com");
    expect(mail.replyTo).toBe("ravi@example.com");
    expect(mail.from).toContain("sunlineendeavour.com");
    expect(mail.subject).toContain("Ravi Kumar");
    expect(mail.text).toContain("E6013");
    expect(mail.text).toContain("× 500");
  });

  it("rejects an unknown SKU with a 400 and field errors", async () => {
    const { app, sent } = testApp();
    const response = await app.request("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Someone",
        email: "someone@example.com",
        items: [{ slug: "sle-nonexistent", quantity: 1 }],
      }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.items?.[0]).toContain("Unknown SKU");
    expect(sent).toHaveLength(0);
  });

  it("rejects invalid input with a 400", async () => {
    const { app, sent } = testApp();
    const response = await app.request("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "X", email: "not-an-email", items: [] }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()) as { errors: unknown }).toHaveProperty("errors");
    expect(sent).toHaveLength(0);
  });

  it("returns 429 when the rate limiter denies", async () => {
    const { app, sent } = testApp({ limiter: { allow: () => false } });
    const response = await app.request("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Ravi",
        email: "ravi@example.com",
        items: [{ slug: "sle-7018", quantity: 10 }],
      }),
    });

    expect(response.status).toBe(429);
    expect(sent).toHaveLength(0);
  });

  it("delivers via the injected mailer even with no SMTP transport configured", async () => {
    const { app, sent } = testApp();
    const response = await app.request("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Ravi",
        email: "ravi@example.com",
        items: [{ slug: "sle-6013", quantity: 1 }],
      }),
    });

    expect(response.status).toBe(201);
    expect(sent).toHaveLength(1);
  });
});

describe("env validation", () => {
  it("refuses to start in production without SMTP", () => {
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow(/SMTP_HOST/);
  });

  it("accepts production when SMTP is configured", () => {
    const config = loadEnv({ NODE_ENV: "production", SMTP_HOST: "smtp.example.com" });
    expect(config.smtp?.host).toBe("smtp.example.com");
    expect(config.mailboxes.to).toBe("sales@sunlineendeavour.com");
  });

  it("defaults to the console mailer config in development", () => {
    const config = loadEnv({});
    expect(config.smtp).toBeUndefined();
    expect(config.mailboxes.to).toBe("sales@sunlineendeavour.com");
  });
});

describe("rate limiter", () => {
  it("allows a burst up to max then blocks within the window", () => {
    const limiter = createRateLimiter(2, 10_000);
    expect(limiter.allow("ip", 0)).toBe(true);
    expect(limiter.allow("ip", 1000)).toBe(true);
    expect(limiter.allow("ip", 2000)).toBe(false);
    expect(limiter.allow("ip", 10_001)).toBe(true);
    expect(limiter.allow("other", 0)).toBe(true);
  });
});

describe("email header sanitisation", () => {
  it("strips CR/LF from values that reach headers", async () => {
    const { app, sent } = testApp();
    await app.request("/api/rfq", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Hacker\r\nBcc: evil@example.com",
        email: "ravi@example.com",
        items: [{ slug: "sle-6013", quantity: 1 }],
      }),
    });

    const mail = sent[0]!;
    expect(mail.subject).not.toContain("\r");
    expect(mail.subject).not.toContain("\n");
    expect(mail.subject.split("\n")).toHaveLength(1);
  });
});

describe("POST /api/lookup", () => {
  it("returns matching products with resolved spec fields", async () => {
    const { app } = testApp();
    const response = await app.request("/api/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aws: ["E6013"] }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; count: number; results: { slug: string; aws: string; diametersMm: number[] }[] };
    expect(body.ok).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(1);
    const match = body.results.find((r: { slug: string }) => r.slug === "sle-6013");
    expect(match).toBeTruthy();
    expect(match!.aws).toBe("E6013");
    expect(Array.isArray(match!.diametersMm)).toBe(true);
  });

  it("fails closed on mechanical criteria the catalogue does not declare", async () => {
    const { app } = testApp();
    const response = await app.request("/api/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ minTensileMpa: 450 }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { count: number };
    expect(body.count).toBe(0);
  });

  it("returns zero results when nothing matches", async () => {
    const { app } = testApp();
    const response = await app.request("/api/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aws: ["E9999"] }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { count: number; results: unknown[] };
    expect(body.count).toBe(0);
    expect(body.results).toEqual([]);
  });

  it("rejects an empty criteria object", async () => {
    const { app } = testApp();
    const response = await app.request("/api/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
  });

  it("rejects malformed criteria with a 400", async () => {
    const { app } = testApp();
    const response = await app.request("/api/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aws: "not-an-array", minTensileMpa: -5 }),
    });
    expect(response.status).toBe(400);
  });
});
