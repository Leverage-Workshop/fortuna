// Runs only when DATABASE_URL is set (e.g. against the local Docker DB after `npm run db:migrate`).
import pg from "pg";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildPoolConfig } from "@/lib/db/config";
import { checkDatabase } from "@/lib/db/health";

describe.skipIf(!process.env.DATABASE_URL)("database (integration)", () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client(buildPoolConfig());
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  test("reports a Postgres 17 server, matching Supabase", async () => {
    const status = await checkDatabase(client);
    expect(status.ok && status.postgresVersion.split(".")[0]).toBe("17");
  });

  test("the migration runner has recorded its table", async () => {
    const { rows } = await client.query("SELECT to_regclass('public.schema_migrations') AS t");
    expect(rows[0]?.t).toBe("schema_migrations");
  });
});
