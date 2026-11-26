# Infrastructure

Fill in each section as the resource is created. Nothing below exists yet.

## Database: Supabase Postgres

| | |
|---|---|
| Project | TBD |
| Region | TBD |
| PostgreSQL | 17 (local Docker matches the major version) |

**TLS:** `pg` treats `sslmode=require` as full verification. Set `DATABASE_CA_CERT` to the
Supabase project's CA PEM so verification succeeds; literal `\n` sequences are accepted for
single-line env values.

**Row-level security:** agent tools reach `handoff_documents` with a short-lived token carrying
the caller's `agent_role`, never the service-role key (PRD "How eve enforces this").

## Hosting: Vercel

| | |
|---|---|
| Team | Leverage Workshop's projects |
| Project | TBD (`fortuna`) |
| Git | `Leverage-Workshop/fortuna`, production branch `main` |
| Node | 24.x |

Health checks: `/api/health/db` and `/api/health/ai` (both return 503 on failure).

Environment variables (server-only, Production + Preview):

- `DATABASE_URL`: Supabase connection string (sensitive)
- `DATABASE_CA_CERT`: Supabase CA PEM
- `AI_MODEL_ID`: unset until a model is chosen

AI Gateway authenticates with Vercel OIDC on deployments, so no `AI_GATEWAY_API_KEY` is
set in Vercel. For local Gateway calls, set `AI_GATEWAY_API_KEY` in `.env.local` or run
`vercel env pull` to fetch a short-lived OIDC token.

## DNS: Cloudflare

| | |
|---|---|
| Zone | `leverageworkshop.com` |
| Record | TBD CNAME → Vercel-assigned target, **DNS only** (not proxied) |

Keep the record unproxied so Vercel can issue and renew the TLS certificate.

## Setup status

- [ ] Supabase project created; migrations applied
- [ ] Vercel project created, linked to GitHub, Node 24, Next.js preset
- [ ] `DATABASE_URL` and `DATABASE_CA_CERT` set in Vercel (Production + Preview); `/api/health/db` → 200
- [ ] AI Gateway reachable from Vercel via OIDC (`/api/health/ai` → 200)
- [ ] Domain added to Vercel and CNAME'd in Cloudflare; TLS issued
