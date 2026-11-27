// Runs only when DATABASE_URL is set, against a database migrated with `npm run db:migrate`.
// Each test runs inside a transaction that is rolled back, so it leaves no rows behind.
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildPoolConfig } from "@/lib/db/config";
import * as schema from "@/lib/db/schema";
import { BREXIT_RUN_ID, BREXIT_SCENARIO_ID } from "@/lib/fixtures/brexit";
import { seedBrexitFixture } from "@/lib/fixtures/seed-brexit";
import { listRuns, loadRunReport } from "@/lib/report/load-run-report";

describe.skipIf(!process.env.DATABASE_URL)("run report (integration)", () => {
  let client: pg.Client;
  let db: NodePgDatabase<typeof schema>;

  beforeAll(async () => {
    client = new pg.Client(buildPoolConfig());
    await client.connect();
    db = drizzle(client, { schema });
  });

  afterAll(async () => {
    await client?.end();
  });

  async function inRollback(fn: () => Promise<void>) {
    await client.query("BEGIN");
    try {
      await fn();
    } finally {
      await client.query("ROLLBACK");
    }
  }

  test("seeding the Brexit fixture is idempotent", async () => {
    await inRollback(async () => {
      await seedBrexitFixture(db);
      const again = await seedBrexitFixture(db);
      expect(again).toEqual({ seeded: false, runId: BREXIT_RUN_ID });

      const { rows } = await client.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM constraint_scores WHERE run_id = $1",
        [BREXIT_RUN_ID],
      );
      expect(rows[0]?.n).toBe(24);
    });
  });

  test("loads the fixture run as a report", async () => {
    await inRollback(async () => {
      await seedBrexitFixture(db);
      const report = await loadRunReport(db, BREXIT_RUN_ID);

      expect(report).not.toBeNull();
      expect(report!.scenario).toMatchObject({ id: BREXIT_SCENARIO_ID, asOf: "2016-07-01", contaminated: true });
      expect(report!.run).toMatchObject({ id: BREXIT_RUN_ID, status: "completed", costUsd: 0, eveSessionId: null });
      expect(report!.forecasts.map((f) => f.outcome)).toEqual([
        "Exit with a withdrawal deal",
        "No exit (delay or extension)",
        "Exit with no deal",
      ]);
      expect(report!.forecasts[0]).toMatchObject({ probability: 0.5322, baselineProbability: 0.4863 });
      expect(report!.actors.map((a) => a.name)).toEqual(["EU27", "House of Commons", "Ireland", "UK Government"]);
      expect(report!.decisionPoints.map((dp) => [dp.position, dp.actorNames, dp.options.length])).toEqual([
        [1, ["UK Government"], 3],
        [2, ["UK Government", "EU27"], 3],
      ]);
      expect(report!.agentOutputs.map((o) => o.agentRole)).toEqual([
        "scenario_parser",
        "actor",
        "actor",
        "actor",
        "actor",
        "political_constraint",
        "economic_constraint",
        "geopolitical_constraint",
        "legal_constraint",
        "judge",
      ]);
    });
  });

  test("a run with no outputs loads with empty sections", async () => {
    await inRollback(async () => {
      const [s] = await db
        .insert(schema.scenarios)
        .values({ text: "Empty scenario", asOf: "2026-11-27", contaminated: false })
        .returning();
      const [run] = await db.insert(schema.runs).values({ scenarioId: s!.id }).returning();

      const report = await loadRunReport(db, run!.id);
      expect(report).toMatchObject({ forecasts: [], agentOutputs: [], actors: [], decisionPoints: [] });
      expect(report!.scenario.resolutionQuestion).toBeNull();
    });
  });

  test("returns null for an unknown or malformed run ID", async () => {
    expect(await loadRunReport(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await loadRunReport(db, "not-a-uuid")).toBeNull();
  });

  test("lists runs newest first with their scenario", async () => {
    await inRollback(async () => {
      // The fixture may already be seeded locally; a far-future run is newer either way.
      await seedBrexitFixture(db);
      const [s] = await db
        .insert(schema.scenarios)
        .values({ text: "Later scenario", asOf: "2026-11-27", contaminated: false })
        .returning();
      await db.insert(schema.runs).values({ scenarioId: s!.id, startedAt: new Date("2100-01-01T00:00:00Z") });

      const runs = await listRuns(db);
      const ids = runs.map((r) => r.id);
      expect(runs[0]?.scenarioText).toBe("Later scenario");
      expect(ids).toContain(BREXIT_RUN_ID);
      expect(runs.find((r) => r.id === BREXIT_RUN_ID)).toMatchObject({ contaminated: true, status: "completed" });
    });
  });
});
