# RUNBOOK — Sunline Endeavour

Operational playbook. Read `DEPLOY.md` first. Unless a section says otherwise,
nothing here is code — it is the checklist that makes the launch phase's exit
criterion true: *green CI on main, monitoring alerting to a real phone, backup
restore tested once.*

## §health

`GET /health` returns `200 {ok, service, db}` where `db` is `not-configured`,
`ok`, or `error`. A `503` with `db:"error"` means the Postgres connection is
down but the API process is alive. The uptime monitor should hit this endpoint,
not the homepage.

## §monitoring (uptime → a real phone)

1. Create an account on any phone-alerting uptime service (UptimeRobot free,
   StatusCake, Uptime Kuma + Pushover).
2. HTTP(s) monitor on `https://api.sunlineendeavour.com/health`, interval ≤ 5
   minutes, expected `200`, **alert via SMS or WhatsApp push to the duty phone**
   — this satisfies "alerting to a real phone".
3. Add a second monitor on `https://www.sunlineendeavour.com/` for the static
   site.
4. Test it: stop the API once and confirm the alert fires.

## §error tracking

API errors are already structured — one JSON line per failure on stdout:

```json
{"event":"api.error","method":"POST","path":"/api/rfq","error":{"name":"...","message":"..."}}
```

Point the host's log drain (Fly/Render/Cloudflare worker-logs) at your
alerting. If a dedicated tracker is wanted later, add `@sentry/node` +
`@sentry/hono`, initialise with a DSN from env, and keep it optional. The
static site intentionally ships no client error tracker; its JS is tiny.

## §backups

RFQ rows are the only data. Managed Postgres (Neon/Supabase/RDS) ships
automated daily backups + PITR — enable both. **Once a month, do a restore
test:**

1. Restore the latest snapshot into a throwaway database.
2. Point the API at it via `DATABASE_URL`, hit `GET /health` → expect
   `db:"ok"`.
3. Confirm `rfq_items` join counts match the snapshot timestamp.
4. Drop the throwaway database.

If the database is ever self-hosted instead, add a `pg_dump` cron to the
off-host backup and follow the same restore test.

## §redirects

The legacy site (`Index.html`, `send_email.php`) is deleted deliberately.
Known legacy URLs are mapped in `apps/web/public/_redirects` (honored by
Netlify and Cloudflare Pages; Vercel needs the same map in `vercel.json`
`redirects`). `send_email.php` is a **410** on purpose — it was a POST-only
form handler, and 410 tells crawlers it is gone for good. Before launch, pull
the old site from the Wayback Machine and extend the map with any other URLs
that still get traffic; never point legacy URLs at the new site wholesale
without checking each one.

## §analytics

Disabled by default and budget-safe (zero tracking JS ships). To enable:

1. Set `PUBLIC_ANALYTICS_SCRIPT_URL` and `PUBLIC_ANALYTICS_DOMAIN` in
   `apps/web/.env` and rebuild (build-time vars).
2. Re-run `pnpm budget` — the tracker script inflates the gzipped HTML and
   can breach the homepage budget; the gate is the canary.
3. Prefer a privacy-first tracker (self-hosted Plausible/Umami) over a third
   party for a site selling to industrial procurement.

## §search engines

- **Google Search Console**: verify ownership (DNS TXT), submit
  `https://<domain>/sitemap-index.xml`, and the domain property shows the
  `robots.txt` and canonical coverage.
- **Bing Webmaster Tools**: import straight from Search Console via the "Import
  from Google" flow, then resubmit the same sitemap.
- Watch the Search Console coverage report for 404s on legacy URLs — they feed
  the §redirects map.

## §DNS + email authentication

SPF, DKIM, DMARC templates and verification pointers are in `DEPLOY.md §4`.
Run a DMARC analyzer for a month before tightening from `p=quarantine` to
`p=reject`. Keep `From:` on our own domain permanently; the visitor address
stays in `Reply-To:`.

## §rollback

- **Web**: the static host keeps build history — redeploy the previous
  `dist/`.
- **API**: redeploy the previous image/commit. If `db:migrate` was the change,
  migrations are append-only and never rolled back; ship a corrective
  migration instead.
- **Content**: a bad spec is a content revert plus a `MISSING-DATA.md` note —
  the data gate (`pnpm content:validate`) runs in CI.

## §on-call triage

- `/health` 503 → database down; check the DB host, restore from backup if
  needed (§backups). The API itself is fine.
- `event:"api.error"` on `/api/rfq` → mailer failed; confirm SMTP and the
  From-domain auth (§DNS), then resend from the host logs if it was real.
- RFQ spam spike → the IP rate limiter is per-process; a single 429 surge may
  mean legitimate buyers behind one NAT, widen the window, do not lower it.
