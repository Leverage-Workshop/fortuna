# Session Progress Log

Running log for agent sessions. Update **Current State** in place; add a dated entry to
**History** at the end of each session (newest first).

## Current State

**Last Updated:** 2026-11-27
**Active Feature:** none. feat-002 (Brexit fixture + run report) is done; next is feat-003.

### What's Done

- [x] Bootstrapped from the Leverage Workshop skeleton (alpha-scout `962b09e`): renamed, PRD installed
      as `docs/PRODUCT.md`, demo chat/NFL code and TimescaleDB removed, harness reset
- [x] `DESIGN.md` design system, referenced from `AGENTS.md`; applied to the app in feat-002
- [x] Infrastructure: Supabase `fortuna`, Vercel `fortuna` (functions in `cle1`), https://fortuna.leverageworkshop.com
      with `/api/health/db` and `/api/health/ai` → 200

- [x] feat-001: Drizzle 0.45.4 / drizzle-kit 0.31.11, the twelve PRD tables (RLS on, no policies),
      immutable forecasts (trigger + RESTRICT FK), schema-drift check in `./init.sh`; migrations
      applied to Supabase (2026-11-27)
- [x] feat-002: Brexit fixture (`npm run db:seed:brexit`), run report at `/runs/[runId]` with all twelve
      PRD sections (three built, nine "Not built yet (Mn)"), runs list on `/`, DESIGN.md tokens and fonts

### What's Next

1. Seed the fixture on Supabase once the owner approves (`docs/INFRASTRUCTURE.md` "Fixture data"): it is
   permanent, since forecasts are immutable. Until then production's run list is empty.
2. feat-003 (eve + scenario parser), the last M1 feature.

## Blockers / Risks

- **eve is a 1.0 release candidate per Vercel's guide**: pin the exact version at install (PRD "Tech stack").
- **Several data sources are non-commercial-only** (PRD "Tools and data sources"): fine for a personal tool.

## Decisions Made

- **Harness lives at the repo root** (`init.sh`, `feature_list.json`, `progress.md`, `session-handoff.md`),
  routed from `AGENTS.md`. `CLAUDE.md` stays a one-line `@AGENTS.md` import.
- **`init.sh` installs only when the lockfile is newer than `node_modules`**, to keep startup fast.
  `--quick` skips `next build`.
- **Every finished request ships as a squash-merged PR** once checks are green (`AGENTS.md` "Shipping").
  The only checks are Vercel's, since `main` has no branch protection.
- **Local ports: app 3200, DB 5433**, so Fortuna runs beside alpha-scout (3100 / 5432). Vercel ignores the
  app port and sets its own.
- **Drizzle schema conventions (feat-001)**: schema in `src/lib/db/schema`, generated SQL in `db/migrations`
  (drizzle-kit journal), applied by `scripts/migrate.ts` via Drizzle's migrator with our TLS config. Migrations run by
  hand on Supabase, never at build time, since Preview and Production share one database. Additions beyond the PRD's
  key fields: `decision_points.label`; `decision_points.position` (PRD `order`, a reserved word); run `finished_at`;
  per-agent tokens/cost/duration on `agent_outputs` (run trace section); `venue` in the `market_snapshots` key, since
  Kalshi and Polymarket IDs are independent. `scenarios.contaminated` has no default, so callers must decide.
- **Forecast immutability**: a trigger rejects DELETE, TRUNCATE and UPDATEs that change any original column; columns
  added later (feat-014's resolution and Brier fields) stay writable. A probability off the code baseline must carry
  `override_reason` (CHECK).
- **RLS on every table, no policies yet**: Supabase's API roles read nothing; the app connects as owner. feat-004 adds
  the handoff-document policy. The "evidence for scores of 2+" rule is left to feat-006's Zod validation, not the DB.
- **Database: Supabase (PRD "Tech stack")**, replacing the skeleton's Aiven + TimescaleDB. Local Docker runs
  `postgres:17` to match Supabase's major version. Plain `pg` + `db/migrations` until Drizzle lands in feat-001.
- **Supabase via the transaction pooler (port 6543)**: the direct host is IPv6-only and unreachable from Vercel.
  TLS is verified against the Supabase Root 2021 CA (fingerprint in `docs/INFRASTRUCTURE.md`).
- **Vercel functions run in `cle1`** (Cleveland), next to Supabase `us-east-2` (Ohio).
- **PRD milestones split into feat-001..015** (2026-11-26, product owner): M1–M6 broken into smaller
  features; feat-005 (constraint tools) may split further per lens.
- **ESLint ignores `.claude/**` and `.agents/**`**: vendored skill example scripts don't pass lint.
- **Design system in `DESIGN.md`** (2026-11-26): adapted from a getdesign.md extraction of The Verge's 2024 site.
  Dark only; Anton / Space Grotesk / JetBrains Mono / Newsreader via `next/font/google`; Tailwind 4 `@theme` tokens
  in §9. It is applied in the same PR as the first UI feature (feat-002), not before.
- **Run report structure (feat-002)**: `src/lib/report/sections.ts` lists the PRD's twelve sections with the
  milestone that fills each; a feature that builds one flips `built` and adds its component to `RunReportView`.
  The page reads through `loadRunReport` (sequential queries: it may get one connection or a transaction).
  Rows render with anchor IDs (`forecast-<id>`, `option-<id>`, …) so later sections can link numbers to rows.
- **Brexit fixture is data, not a run**: fixed IDs (`b2e01600-…`), model `fixture`, null tokens/cost, run cost $0,
  contaminated. Baselines are the PRD's e^(−0.5 × load) arithmetic, checked in `brexit.test.ts`, not computed by
  app code (the aggregation module belongs to M3). Rationales reuse each lens's PRD finding. No market link: the
  PRD's 45¢ contract is illustrative and would mislead the M5 snapshot job.
- **Schema files import with `.ts` extensions** so plain-Node scripts (`scripts/seed-brexit.ts`) can load them.
- **PR template** at `.github/pull_request_template.md`. Core sections follow common industry guidance:
  summary/why, changes, how to review, test plan, risk/rollback. Migrations, config and screenshots are conditional.

## Evidence of Completion

(Per-feature evidence lives in `feature_list.json`.)

## History

### 2026-11-27: feat-002 Brexit fixture and run report

- Fixture data in `src/lib/fixtures/brexit.ts` (PRD "Worked example: Brexit": 4 actors, 2 decision points,
  6 options, 24 constraint scores, 10 agent outputs, 3 forecasts with the judge override), seeded by
  `seedBrexitFixture` via `npm run db:seed:brexit` in one transaction, idempotent.
- Run report `/runs/[runId]`: Summary (feature tile, contaminated pill, override reason one click away), Run trace
  and cost, Scenario breakdown; the other nine sections render "Not built yet (Mn)", and built sections with no rows
  say "No data for this run." Home lists runs. Applied DESIGN.md §9 (tokens, four fonts, dark only), plus root
  `error.tsx` (16.4's `retry` prop) and `not-found.tsx`.
- Verified: `DATABASE_URL=…:5433/fortuna ./init.sh` passed (lint, typecheck, drift, 51 tests incl. 20 DB integration,
  build). Seeded local Docker twice (second run no-op). `next start`: `/` 200, fixture report 200, unknown and
  malformed run IDs 404; headless screenshots at 1440px and 375px checked against DESIGN.md §10.
- Not built (no feature entry): the report's Markdown export, and number-to-row links (anchors exist; the
  sections that link arrive with M2/M3). Run trace shows the eve session ID as text until feat-003 defines the
  Agent Runs trace URL.

### 2026-11-27: feat-001 Supabase verification

- Owner applied `0000_init_schema` and `0001_forecasts_immutable` to Supabase `fortuna` with `scripts/migrate.ts`.
- Verified via the Supabase MCP: all twelve tables in `public` with RLS on; `drizzle.__drizzle_migrations` holds two
  rows whose hashes match the SHA-256 of the local SQL files; `forecasts_immutable_row` and
  `forecasts_immutable_truncate` triggers present; `forecasts.run_id` FK is `ON DELETE RESTRICT`. Security advisor
  reports only the INFO lint `rls_enabled_no_policy` on the twelve tables, which is the intended deny-all until feat-004.
- feat-001 marked done; PR #5 merged.

### 2026-11-26: feat-001 data layer

- Installed `drizzle-orm@0.45.4` and `drizzle-kit@0.31.11` (exact pins). Added the twelve-table schema, migrations
  `0000_init_schema` and `0001_forecasts_immutable`, a Drizzle client (`src/lib/db/client.ts`), `db:generate` and
  `db:drift` scripts, and the drift step in `./init.sh`. Dropped the old runner's empty `schema_migrations` table from
  local Docker (Supabase never had it).
- Verified locally: `npm run db:migrate` twice (second run no-op), then
  `DATABASE_URL=…:5433/fortuna ./init.sh` passed: 24 tests, 15 of them DB integration (tables + RLS, typed round
  trip, immutability incl. TRUNCATE and FK RESTRICT, CHECKs). Drift check confirmed to fail on an unmigrated column.

### 2026-11-26: infrastructure (README step 6)

- Created Supabase project `fortuna` (`us-east-2`, Postgres 17.12) and Vercel project `fortuna` linked to the repo,
  functions moved to `cle1`. Owner set `DATABASE_URL` (transaction pooler); `DATABASE_CA_CERT` set from Supabase's
  published root CA after checking it against both us-east-2 pooler chains. Cloudflare CNAME `fortuna` → Vercel, DNS only.
- Added `.mcp.json` with Cloudflare's MCP server. `AI_MODEL_ID` stays unset until feat-003.
- Verified on https://fortuna.leverageworkshop.com: `/` → 200, `/api/health/db` → 200 `{"ok":true,"postgresVersion":"17.12"}`,
  `/api/health/ai` → 200.

### 2026-11-26: bootstrap from skeleton

- Followed the skeleton README: renamed alpha-scout → fortuna, installed the Fortuna PRD as `docs/PRODUCT.md`,
  removed the streaming chat and NFL tool (the PRD lists a chat assistant as a non-goal) and their
  `@ai-sdk/react` / `streamdown` deps, and replaced TimescaleDB with plain Postgres 17.
- `/api/health/db` now reports the Postgres version (no extension check).
- Verified: `npm run db:up && npm run db:migrate`, then `DATABASE_URL=…:5433/fortuna ./init.sh` passed (lint,
  typecheck, 8 tests incl. 2 DB integration, build). `npm start` on 3200: `/api/health/db` → 200
  (`17.12`); `/api/health/ai` → 503 `GatewayAuthenticationError` as expected with no local Gateway key.
- Earlier the same day: `DESIGN.md` added (#1) and `next` patched 16.4.3 → 16.4.6 for a security advisory (#2).
