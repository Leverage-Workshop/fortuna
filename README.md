# Fortuna

A personal forecasting tool for market-moving geopolitical events. A team of AI agents applies
the constraint framework from Marko Papic's *Geopolitical Alpha*: it separates what each actor
wants from what each actor can do, scores every option against political, economic, geopolitical
and legal constraints, and outputs a probability-weighted decision tree. Forecasts are compared
with live Kalshi and Polymarket prices, logged, and scored when the event resolves.

- Product: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Design system: [`DESIGN.md`](DESIGN.md)
- Infrastructure: [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md)
- Agent guidance and workflow: [`AGENTS.md`](AGENTS.md); status in `progress.md` and `feature_list.json`

Started from the Leverage Workshop skeleton (alpha-scout `962b09e`).

## Stack

| Area | What's in place |
|---|---|
| App | Next.js 16.4 (App Router), React 19.3, TypeScript 5, Tailwind CSS 4, Base UI, Zustand |
| Database | Supabase Postgres 17 in production, `postgres:17` in Docker locally, plain `pg`, SQL migration runner (`db/migrations`, `scripts/migrate.ts`) |
| AI | Vercel AI SDK + AI Gateway. eve agents arrive with feat-003 |
| Health checks | `GET /api/health/db` and `GET /api/health/ai` |
| Quality gate | ESLint, `tsc`, Vitest (unit + DB integration), all run by `./init.sh` |
| Hosting | Vercel, with Cloudflare DNS |

## Local setup

Requires Node 24 (`nvm use`) and Docker.

```bash
npm install
cp .env.example .env.local      # defaults point at the local Docker DB
npm run db:up                   # Postgres 17, host port 5433
npm run db:migrate              # applies db/migrations/*.sql
npm run dev                     # http://localhost:3200
```

## Scripts

| Script | Purpose |
|---|---|
| `dev` / `build` / `start` | Next.js (port 3200) |
| `lint` / `typecheck` / `test` | ESLint, `tsc --noEmit`, Vitest |
| `db:up` / `db:down` | Local Postgres via Docker Compose |
| `db:migrate` | Apply pending SQL migrations (tracked in `schema_migrations`) |
| `./init.sh [--quick]` | The full pre-push gate: `npm ci` if needed, lint, typecheck, test, build |

DB integration tests in `tests/` run only when `DATABASE_URL` is exported (Vitest doesn't read
`.env.local`):

```bash
DATABASE_URL=postgresql://fortuna:fortuna@localhost:5433/fortuna ./init.sh
```

## Environment variables

All server-only. Never prefix them with `NEXT_PUBLIC_`. See `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `DATABASE_CA_CERT` | CA PEM for TLS to Supabase (unset locally) |
| `AI_GATEWAY_API_KEY` | Local AI Gateway auth (Vercel deployments use OIDC) |
| `AI_MODEL_ID` | Gateway model ID, e.g. `provider/model`. No default |

## Agent skills

`.claude/skills` and `.agents/skills` hold the same vendored skills (one copy per agent tool),
pinned in `skills-lock.json`. ESLint ignores both directories because the skill example scripts
don't pass lint.
