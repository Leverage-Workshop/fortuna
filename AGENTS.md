# Agent guidance

Read `docs/PRODUCT.md` first: Fortuna's PRD. Its milestones (M1–M6, "MVP scope and milestones")
are broken into the entries in `feature_list.json`; build only those. "Out of MVP" items, the
PRD's non-goals (trading, multi-user, chat assistant) and tools marked "Later" stay unbuilt until
the product owner approves them.

## Startup Workflow

Before writing code:

1. Read this file and `docs/PRODUCT.md` (plus `docs/INFRASTRUCTURE.md` for DB/hosting work, and
   `DESIGN.md` for any UI work).
2. Read `progress.md` (current state, blockers) and `feature_list.json` (feature status).
3. Run `./init.sh`. If the baseline fails, fix that before adding scope.
4. Check recent work with `git log --oneline -5`.

## Verification Commands

- `./init.sh`: the pre-push gate (`npm ci` when the lockfile changed, then lint, typecheck,
  schema drift, test, build). `./init.sh --quick` skips the build.
- DB integration tests run only when `DATABASE_URL` is exported (Vitest does not read
  `.env.local`): `npm run db:up && npm run db:migrate`, then
  `DATABASE_URL=postgresql://fortuna:fortuna@localhost:5433/fortuna ./init.sh`.
  Required for any change touching `src/lib/db`, `scripts/` or `db/migrations`.

## Working Rules

- **One feature at a time**: work on the `in-progress` feature in `feature_list.json`, or move
  exactly one unblocked `not-started` feature to `in-progress`.
- **Stay in scope**: only build what a `feature_list.json` entry describes. New features are added
  only after the product owner approves them; never invent entries to justify work.
- **Blocked means blocked**: don't work around a `blocked_on` reason; report it.

## Definition of Done

A feature is done only when:

- [ ] The behavior in its `description` is implemented
- [ ] `./init.sh` passes, plus DB integration tests if the DB was touched
- [ ] Evidence (commands run, results, commit/PR) is recorded in the feature's `evidence`
- [ ] `progress.md` reflects the new state

## End of Session

1. Update `progress.md`: Current State plus a dated History entry.
2. Update `feature_list.json` status and evidence.
3. For multi-session work, fill in `session-handoff.md`.
4. Ship the work (below) and leave the tree clean on `main` so `./init.sh` runs next time.

## Shipping: every finished request ends in a merged PR

When the work for a request is finished and `./init.sh` passes, open a PR and merge it without
asking again. Skip this only when the request changed no files, or the user says not to merge.

1. **Branch** off an up-to-date `main` as `<type>/<short-name>` (types: feat, fix, refactor, docs,
   test, chore, perf, ci). Never commit directly to `main`.
2. **Commit** with a conventional message (`<type>: <description>`), including the harness
   updates (`progress.md`, `feature_list.json`) in the same PR.
3. **Open the PR**: `git push -u origin HEAD`, then
   `gh pr create --title "<type>: <description>" --body-file <file>`. Write the body file by
   filling in every section of `.github/pull_request_template.md`; `gh` does not apply the
   template when `--body`/`--body-file` is given. Delete sections that don't apply; tick only
   checks you actually ran.
4. **Wait for checks**: `gh pr checks --watch`. The Vercel checks can take a minute to appear; if
   none are reported yet, wait briefly and re-run.
5. **Merge** once every check passes: `gh pr merge --squash --delete-branch`, then
   `git checkout main && git pull --ff-only`.
6. **Report** the PR URL and the merge commit to the user.

If a check fails or the PR conflicts, fix it on the branch and repeat from step 4. Never merge a
red PR, never use `gh pr merge --admin`, and never force-push `main`. If you can't get it green,
leave the PR open, record the blocker in `progress.md`, and tell the user.

## Conventions

- Node 24, npm, committed `package-lock.json`. Pin known-compatible versions; don't bulk-upgrade.
- `src/` uses the `@/*` alias. Server-only modules import `server-only`.
- Database: Supabase Postgres 17 in production, `postgres:17` in Docker locally, through Drizzle.
  Change `src/lib/db/schema` first, then `npm run db:generate -- --name <change>` (`--custom` for
  SQL Drizzle can't express, such as triggers); `./init.sh` fails on schema drift. Every table
  enables row-level security. Parameterize every query; migrations are never edited after merge.
- Agent tools never use the Supabase service-role key: it bypasses the row-level security that
  isolates handoff documents by agent role (PRD "How eve enforces this").
- Secrets live in env vars only. Never use `NEXT_PUBLIC_` for DB or AI credentials.
- AI: models go through AI Gateway, assigned per role in one models file (PRD "Agent
  architecture"). No default model yet. Agents return Zod-validated structured output; baseline
  probabilities are computed in code from constraint scores, never by a model.
- Date-bearing tools take a cutoff set by the wrapper from the run's as-of date; the model never
  chooses it.
- UI follows `DESIGN.md`: dark only, its tokens, type roles (mono = data, serif = model prose)
  and data semantics (model = mint, market = white, signed edge). Change a token in `DESIGN.md`
  first, then in code. Its patterns style approved features; they don't authorize new ones.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
