# Infrastructure

## Database: Supabase Postgres

| | |
|---|---|
| Organization | Leverage Workshop |
| Project | `fortuna` (ref `fgmvtpflzhngzwbliyqf`) |
| Region | `us-east-2` (Ohio) |
| PostgreSQL | 17.12 (local Docker runs `postgres:17` to match the major version) |
| App connection | Shared pooler (Supavisor), **transaction mode**, port 6543 |

**Why the transaction pooler:** the direct host `db.<ref>.supabase.co` is IPv6-only, which Vercel
functions can't reach, and transaction mode is Supabase's recommendation for serverless. Get the
string from the dashboard's Connect panel:
`https://supabase.com/dashboard/project/fgmvtpflzhngzwbliyqf?showConnect=true&method=transaction`.
User is `postgres.fgmvtpflzhngzwbliyqf`; append `?sslmode=require`. The password is reset from
Database Settings and lives only in Vercel and your `.env.local`.

**TLS:** `pg` treats `sslmode=require` as full verification, so `DATABASE_CA_CERT` holds the
Supabase Root 2021 CA:

- Source: `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`
  (the dashboard's SSL Configuration download)
- SHA-256: `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`
- Valid until 2031-04-26. Checked 2026-11-26: both `aws-0-` and `aws-1-us-east-2.pooler.supabase.com:6543`
  present `*.pooler.supabase.com` → Supabase Intermediate 2021 CA → this root, hostname verified.

Literal `\n` sequences are accepted for single-line env values.

**Migrations:** Drizzle migrations in `db/migrations` are applied by hand, never at build time,
because Preview and Production share this database. Put the production `DATABASE_URL` and
`DATABASE_CA_CERT` in a gitignored `.env.supabase`, then run
`node --env-file=.env.supabase scripts/migrate.ts`. The runner records each migration in
`drizzle.__drizzle_migrations` and applies pending ones in a single transaction. Apply a PR's
migrations before merging it if its code depends on them.

**Fixture data:** `node --env-file=.env.supabase scripts/seed-brexit.ts` seeds the PRD's Brexit
walkthrough as one contaminated run with fixed IDs (report at `/runs/b2e01600-0000-4000-8000-000000000002`).
It is idempotent, but permanent: forecasts are immutable and their run can't be deleted.

**Row-level security:** every table has RLS enabled with no policies, so Supabase's `anon` and
`authenticated` API roles can read nothing; the app connects as the table owner, which bypasses
it. feat-004 adds the handoff-document policy: agent tools reach `handoff_documents` with a
short-lived token carrying the caller's `agent_role`, never the service-role key (PRD "How eve
enforces this").

## Hosting: Vercel

| | |
|---|---|
| Team | Leverage Workshop's projects |
| Project | `fortuna` (`prj_00ZBqixWLATHsyMI8w4RTk1arx1u`) |
| Git | `Leverage-Workshop/fortuna`, production branch `main` |
| Framework / Node | Next.js preset, 24.x |
| Function region | `cle1` (Cleveland), next to the Supabase database in `us-east-2` |
| Deployment protection | Vercel Authentication on everything except custom domains |

Health checks: `/api/health/db` and `/api/health/ai` (both return 503 on failure).

Environment variables (server-only, Production + Preview):

- `DATABASE_URL`: Supabase transaction-pooler string (sensitive)
- `DATABASE_CA_CERT`: Supabase Root 2021 CA PEM (encrypted; public certificate)
- `AI_MODEL_ID`: unset until feat-003 assigns per-role models

AI Gateway authenticates with Vercel OIDC on deployments, so no `AI_GATEWAY_API_KEY` is
set in Vercel. For local Gateway calls, set `AI_GATEWAY_API_KEY` in `.env.local` or run
`vercel env pull` to fetch a short-lived OIDC token.

## DNS: Cloudflare

| | |
|---|---|
| Zone | `leverageworkshop.com` |
| Record | `fortuna` CNAME → `7cd5d845d0aa0885.vercel-dns-017.com`, **DNS only** (not proxied) |
| URL | https://fortuna.leverageworkshop.com |

Keep the record unproxied so Vercel can issue and renew the TLS certificate. The project's
`.mcp.json` registers Cloudflare's MCP server (`cloudflare-api`) for DNS changes.

## Setup status

- [x] Supabase project created (2026-11-26); feat-001 migrations `0000`–`0001` applied (2026-11-27)
- [x] Vercel project created, linked to GitHub, Node 24, Next.js preset, functions in `cle1`
- [x] `DATABASE_URL` and `DATABASE_CA_CERT` set in Vercel (Production + Preview); `/api/health/db` → 200 (2026-11-26)
- [x] AI Gateway reachable from Vercel via OIDC (`/api/health/ai` → 200)
- [x] `fortuna.leverageworkshop.com` added to Vercel and CNAME'd in Cloudflare; TLS issued
