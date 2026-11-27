// Applies the Drizzle migrations in db/migrations (journal order, once each, in one transaction),
// recording them in drizzle.__drizzle_migrations.
// Usage: npm run db:migrate   (reads DATABASE_URL / DATABASE_CA_CERT from env or .env.local)
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { buildPoolConfig } from "../src/lib/db/config.ts";

const migrationsFolder = path.join(import.meta.dirname, "..", "db", "migrations");
const client = new pg.Client(buildPoolConfig());
await client.connect();

try {
  await migrate(drizzle(client), { migrationsFolder });
  const { rows } = await client.query<{ count: string }>(
    "SELECT count(*) FROM drizzle.__drizzle_migrations",
  );
  console.log(`migrations up to date (${rows[0]?.count ?? 0} applied)`);
} catch (err) {
  throw new Error("migration failed; nothing from this run was committed", { cause: err });
} finally {
  await client.end();
}
