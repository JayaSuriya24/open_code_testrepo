import { z } from "zod";

const portSchema = z.coerce.number().int().min(1).max(65535);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: portSchema.default(8787),
  APP_URL: z.url().default("http://localhost:4321"),
  DATABASE_URL: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: portSchema.default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().min(3).default("Sunline Endeavour <rfq@sunlineendeavour.com>"),
  SMTP_TO: z.email().default("sales@sunlineendeavour.com"),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(600_000),
});

export interface SmtpTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}

export interface Env {
  nodeEnv: "development" | "production" | "test";
  port: number;
  appUrl: string;
  databaseUrl?: string;
  smtp?: SmtpTransportConfig;
  mailboxes: { from: string; to: string };
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.parse(source);
  if (parsed.NODE_ENV === "production" && !parsed.SMTP_HOST) {
    throw new Error("SMTP_HOST is required when NODE_ENV=production; RFQs would be lost otherwise.");
  }
  const smtp = parsed.SMTP_HOST
    ? {
        host: parsed.SMTP_HOST,
        port: parsed.SMTP_PORT,
        secure: parsed.SMTP_SECURE === "true",
        ...(parsed.SMTP_USER ? { user: parsed.SMTP_USER } : {}),
        ...(parsed.SMTP_PASS ? { pass: parsed.SMTP_PASS } : {}),
      }
    : undefined;
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    appUrl: parsed.APP_URL,
    ...(parsed.DATABASE_URL ? { databaseUrl: parsed.DATABASE_URL } : {}),
    ...(smtp ? { smtp } : {}),
    mailboxes: { from: parsed.SMTP_FROM, to: parsed.SMTP_TO },
    rateLimitMax: parsed.RATE_LIMIT_MAX,
    rateLimitWindowMs: parsed.RATE_LIMIT_WINDOW_MS,
  };
}
