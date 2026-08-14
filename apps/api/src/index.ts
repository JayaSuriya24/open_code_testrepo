import { serve } from "@hono/node-server";
import { createDb } from "@se/db";
import { createApp } from "./app.ts";
import { loadEnv } from "./env.ts";
import { createConsoleMailer, createSmtpMailer } from "./rfq/mailer.ts";
import { createRateLimiter } from "./rfq/rate-limit.ts";

const config = loadEnv();

const mailer = config.smtp
  ? createSmtpMailer(config.smtp)
  : createConsoleMailer((message) =>
      console.info("[rfq] email intercepted (no SMTP configured):", {
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
      }),
    );
const db = config.databaseUrl ? createDb(config.databaseUrl) : undefined;

const app = createApp({
  config,
  mailer,
  db,
  limiter: createRateLimiter(config.rateLimitMax, config.rateLimitWindowMs),
});

serve({ fetch: app.fetch, port: config.port });

export default app;
