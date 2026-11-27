// Runs only when DATABASE_URL is set, against a database migrated with `npm run db:migrate`.
// Each test runs inside a transaction that is rolled back, so it leaves no rows behind.
import { eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import journal from "../db/migrations/meta/_journal.json";
import { buildPoolConfig } from "@/lib/db/config";
import * as schema from "@/lib/db/schema";

const PRD_TABLES = [
  "actors",
  "agent_outputs",
  "constraint_scores",
  "decision_points",
  "forecasts",
  "handoff_documents",
  "market_links",
  "market_snapshots",
  "options",
  "runs",
  "scenarios",
  "tool_calls",
];

describe.skipIf(!process.env.DATABASE_URL)("schema (integration)", () => {
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

  /** Expects one statement to fail without aborting the surrounding test transaction. */
  async function expectRejected(text: string, params: unknown[], pattern: RegExp) {
    await client.query("SAVEPOINT expect_rejected");
    try {
      await expect(client.query(text, params)).rejects.toThrow(pattern);
    } finally {
      await client.query("ROLLBACK TO SAVEPOINT expect_rejected");
    }
  }

  /** A small Brexit-shaped scenario with one run, one score and one forecast. */
  async function seed() {
    const [scenario] = await db
      .insert(schema.scenarios)
      .values({
        text: "Will the UK formally leave the EU by 31 December 2020?",
        asOf: "2016-07-01",
        horizon: "2020-12-31",
        resolutionQuestion: "UK is no longer an EU member state on 31 December 2020.",
        contaminated: true,
      })
      .returning();
    const [actor] = await db
      .insert(schema.actors)
      .values({ scenarioId: scenario!.id, name: "UK Government", regimeType: "democratic" })
      .returning();
    const [point] = await db
      .insert(schema.decisionPoints)
      .values({ scenarioId: scenario!.id, label: "Article 50 timing", actorIds: [actor!.id], position: 1 })
      .returning();
    const [option] = await db
      .insert(schema.options)
      .values({ decisionPointId: point!.id, label: "Invoke within 12 months", position: 1 })
      .returning();
    const [run] = await db
      .insert(schema.runs)
      .values({ scenarioId: scenario!.id, status: "completed", costUsd: 0.0425 })
      .returning();
    const [call] = await db
      .insert(schema.toolCalls)
      .values({
        runId: run!.id,
        agentRole: "political_constraint",
        tool: "get_polls",
        argsJson: { country: "GB" },
        cutoff: new Date("2016-07-01T00:00:00Z"),
        sourceUrl: "https://example.org/polls",
      })
      .returning();
    await db.insert(schema.constraintScores).values({
      runId: run!.id,
      optionId: option!.id,
      lens: "political",
      score: 0,
      rationale: "Delivering the result is what keeps the governing party in power.",
      evidenceToolCallIds: [call!.id],
    });
    const [forecast] = await db
      .insert(schema.forecasts)
      .values({ runId: run!.id, outcome: "Exit with a withdrawal deal", probability: 0.53, baselineProbability: 0.49, overrideReason: "Judge override on DP1" })
      .returning();
    return { scenario: scenario!, option: option!, run: run!, forecast: forecast! };
  }

  test("every migration in the journal has been applied", async () => {
    const { rows } = await client.query<{ hash: string }>("SELECT hash FROM drizzle.__drizzle_migrations");
    expect(rows).toHaveLength(journal.entries.length);
  });

  test("creates the twelve tables with row-level security enabled", async () => {
    const { rows } = await client.query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT relname, relrowsecurity FROM pg_class
        WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relname = ANY($1)
        ORDER BY relname`,
      [PRD_TABLES],
    );
    expect(rows.map((r) => r.relname)).toEqual(PRD_TABLES);
    expect(rows.every((r) => r.relrowsecurity)).toBe(true);
  });

  test("round-trips a run through the typed client", async () => {
    await inRollback(async () => {
      const { scenario, run, forecast } = await seed();
      await db.insert(schema.handoffDocuments).values({ runId: run.id, authorRole: "actor", markdown: "# Dossier" });
      await db.insert(schema.marketLinks).values({ scenarioId: scenario.id, venue: "kalshi", contractId: "BREXIT-20", matchScore: 0.9 });
      await db.insert(schema.marketSnapshots).values({ venue: "kalshi", contractId: "BREXIT-20", ts: new Date(), midPrice: 0.45, volume: 1200 });

      const [stored] = await db.select().from(schema.runs).where(eq(schema.runs.id, run.id));
      expect(stored?.costUsd).toBe(0.0425);
      expect(scenario.asOf).toBe("2016-07-01");
      expect(forecast.probability).toBe(0.53);
    });
  });

  describe("forecasts are immutable", () => {
    test("rejects updating a forecast column", async () => {
      await inRollback(async () => {
        const { forecast } = await seed();
        await expectRejected("UPDATE forecasts SET probability = 0.9 WHERE id = $1", [forecast.id], /immutable: UPDATE/);
        await expectRejected("UPDATE forecasts SET override_reason = NULL WHERE id = $1", [forecast.id], /immutable/);
      });
    });

    test("allows an update that changes nothing", async () => {
      await inRollback(async () => {
        const { forecast } = await seed();
        const result = await client.query("UPDATE forecasts SET outcome = outcome WHERE id = $1", [forecast.id]);
        expect(result.rowCount).toBe(1);
      });
    });

    test("rejects DELETE and TRUNCATE", async () => {
      await inRollback(async () => {
        const { forecast } = await seed();
        await expectRejected("DELETE FROM forecasts WHERE id = $1", [forecast.id], /immutable: DELETE/);
        await expectRejected("TRUNCATE forecasts CASCADE", [], /immutable: TRUNCATE/);
      });
    });

    test("blocks deleting the run or scenario behind a forecast", async () => {
      await inRollback(async () => {
        const { scenario, run } = await seed();
        await expectRejected("DELETE FROM runs WHERE id = $1", [run.id], /foreign key/);
        await expectRejected("DELETE FROM scenarios WHERE id = $1", [scenario.id], /foreign key/);
      });
    });
  });

  describe("constraints", () => {
    test("constraint scores stay within 0 to 4", async () => {
      await inRollback(async () => {
        const { run, option } = await seed();
        await expectRejected(
          "INSERT INTO constraint_scores (run_id, option_id, lens, score, rationale) VALUES ($1, $2, 'legal', 5, 'x')",
          [run.id, option.id],
          /constraint_scores_score_range/,
        );
      });
    });

    test("one score per option per lens", async () => {
      await inRollback(async () => {
        const { run, option } = await seed();
        await expectRejected(
          "INSERT INTO constraint_scores (run_id, option_id, lens, score, rationale) VALUES ($1, $2, 'political', 1, 'x')",
          [run.id, option.id],
          /constraint_scores_pkey/,
        );
      });
    });

    test("probabilities stay within 0 to 1", async () => {
      await inRollback(async () => {
        const { run } = await seed();
        await expectRejected(
          "INSERT INTO forecasts (run_id, outcome, probability) VALUES ($1, 'No exit', 1.2)",
          [run.id],
          /forecasts_probability_range/,
        );
      });
    });

    test("a probability off the baseline needs an override reason", async () => {
      await inRollback(async () => {
        const { run } = await seed();
        await expectRejected(
          "INSERT INTO forecasts (run_id, outcome, probability, baseline_probability) VALUES ($1, 'No exit', 0.4, 0.3)",
          [run.id],
          /forecasts_override_has_reason/,
        );
        const ok = await client.query(
          "INSERT INTO forecasts (run_id, outcome, probability, baseline_probability) VALUES ($1, 'No exit', 0.4, 0.4)",
          [run.id],
        );
        expect(ok.rowCount).toBe(1);
      });
    });

    test("a decision point names at least one actor", async () => {
      await inRollback(async () => {
        const { scenario } = await seed();
        await expectRejected(
          "INSERT INTO decision_points (scenario_id, label, actor_ids, position) VALUES ($1, 'x', '{}', 2)",
          [scenario.id],
          /decision_points_actor_ids_nonempty/,
        );
      });
    });

    test("contaminated must be stated explicitly", async () => {
      await inRollback(async () => {
        await expectRejected(
          "INSERT INTO scenarios (text, as_of) VALUES ('x', '2026-11-26')",
          [],
          /contaminated/,
        );
      });
    });
  });
});
