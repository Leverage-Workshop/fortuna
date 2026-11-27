// Seeds the PRD's Brexit worked example as one completed, contaminated fixture run, in a single
// transaction. Safe to re-run: it does nothing if the fixture run already exists.
// Usage: npm run db:seed:brexit   (reads DATABASE_URL / DATABASE_CA_CERT from env or .env.local)
// Forecasts are immutable, so once seeded on a database the fixture can't be removed or changed.
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { buildPoolConfig } from "../src/lib/db/config.ts";
import * as schema from "../src/lib/db/schema/index.ts";
import { seedBrexitFixture } from "../src/lib/fixtures/seed-brexit.ts";

const client = new pg.Client(buildPoolConfig());
await client.connect();

try {
  const db = drizzle(client, { schema });
  const { seeded, runId } = await db.transaction((tx) => seedBrexitFixture(tx));
  console.log(seeded ? `seeded Brexit fixture run ${runId}` : `Brexit fixture run ${runId} already exists; nothing written`);
  console.log(`report: /runs/${runId}`);
} catch (err) {
  throw new Error("seeding failed; nothing from this run was committed", { cause: err });
} finally {
  await client.end();
}
