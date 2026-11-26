# Session Progress Log

Running log for agent sessions. Update **Current State** in place; add a dated entry to
**History** at the end of each session (newest first).

## Current State

**Last Updated:** 2026-11-26
**Active Feature:** none. feat-001 (M1 data layer) is next.

### What's Done

- [x] Bootstrapped from the Leverage Workshop skeleton (alpha-scout `962b09e`): renamed, PRD installed
      as `docs/PRODUCT.md`, demo chat/NFL code and TimescaleDB removed, harness reset
- [x] `DESIGN.md` design system, referenced from `AGENTS.md` (docs only; not yet applied to the app)

### What's Next

1. Infrastructure (README step 6): Supabase project, Vercel project and env vars, DNS.
2. feat-001: Drizzle + the PRD's twelve-table schema.

## Blockers / Risks

- **Infrastructure not set up yet**: no Supabase project or Vercel project, so PRs get no checks and
  the shipping workflow's `gh pr checks --watch` has nothing to wait for.
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
- **Database: Supabase (PRD "Tech stack")**, replacing the skeleton's Aiven + TimescaleDB. Local Docker runs
  `postgres:17` to match Supabase's major version. Plain `pg` + `db/migrations` until Drizzle lands in feat-001.
- **PRD milestones split into feat-001..015** (2026-11-26, product owner): M1–M6 broken into smaller
  features; feat-005 (constraint tools) may split further per lens.
- **ESLint ignores `.claude/**` and `.agents/**`**: vendored skill example scripts don't pass lint.
- **Design system in `DESIGN.md`** (2026-11-26): adapted from a getdesign.md extraction of The Verge's 2024 site.
  Dark only; Anton / Space Grotesk / JetBrains Mono / Newsreader via `next/font/google`; Tailwind 4 `@theme` tokens
  in §9. It is applied in the same PR as the first UI feature (feat-002), not before.
- **PR template** at `.github/pull_request_template.md`. Core sections follow common industry guidance:
  summary/why, changes, how to review, test plan, risk/rollback. Migrations, config and screenshots are conditional.

## Evidence of Completion

(Per-feature evidence lives in `feature_list.json`.)

## History

### 2026-11-26: bootstrap from skeleton

- Followed the skeleton README: renamed alpha-scout → fortuna, installed the Fortuna PRD as `docs/PRODUCT.md`,
  removed the streaming chat and NFL tool (the PRD lists a chat assistant as a non-goal) and their
  `@ai-sdk/react` / `streamdown` deps, and replaced TimescaleDB with plain Postgres 17.
- `/api/health/db` now reports the Postgres version (no extension check).
- Verified: `npm run db:up && npm run db:migrate`, then `DATABASE_URL=…:5433/fortuna ./init.sh` passed (lint,
  typecheck, 8 tests incl. 2 DB integration, build). `npm start` on 3200: `/api/health/db` → 200
  (`17.12`); `/api/health/ai` → 503 `GatewayAuthenticationError` as expected with no local Gateway key.
- Earlier the same day: `DESIGN.md` added (#1) and `next` patched 16.4.3 → 16.4.6 for a security advisory (#2).
