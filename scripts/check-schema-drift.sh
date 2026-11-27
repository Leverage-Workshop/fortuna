#!/usr/bin/env bash
# Fails when src/lib/db/schema differs from what db/migrations produces, i.e. a schema edit
# without `npm run db:generate`. Generates into a scratch copy so the repo is never touched.
set -euo pipefail
cd "$(dirname "$0")/.."

# drizzle-kit resolves --out relative to the cwd, so the scratch copy lives inside the repo
# (node_modules/.cache is gitignored).
scratch="node_modules/.cache/schema-drift"
rm -rf "$scratch"
mkdir -p "$scratch"
trap 'rm -rf "$scratch"' EXIT
cp -r db/migrations/. "$scratch"

before="$(find "$scratch" -name '*.sql' | wc -l)"
npx drizzle-kit generate --dialect postgresql --schema ./src/lib/db/schema/index.ts --out "$scratch" >/dev/null
after="$(find "$scratch" -name '*.sql' | wc -l)"

if [ "$after" != "$before" ]; then
  echo "Schema drift: src/lib/db/schema has changes with no migration. Run: npm run db:generate -- --name <change>" >&2
  exit 1
fi
echo "schema matches migrations"
