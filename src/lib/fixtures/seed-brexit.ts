// Inserts the Brexit fixture (src/lib/fixtures/brexit.ts) as one completed, contaminated run.
// Idempotent: if the fixture run already exists, nothing is written. Forecasts are immutable,
// so a seeded fixture can't be re-seeded with different numbers; change the IDs instead.
// Callers wrap this in a transaction (scripts/seed-brexit.ts does) so it lands all or nothing.
import { eq } from "drizzle-orm";
import * as schema from "../db/schema/index.ts";
import type { AppDb } from "../db/types.ts";
import * as fx from "./brexit.ts";

export type SeedResult = { seeded: boolean; runId: string };

export async function seedBrexitFixture(db: AppDb, now: Date = new Date()): Promise<SeedResult> {
  const runId = fx.BREXIT_RUN_ID;
  const existing = await db.select({ id: schema.runs.id }).from(schema.runs).where(eq(schema.runs.id, runId));
  if (existing.length > 0) {
    return { seeded: false, runId };
  }

  // Agent outputs are stamped 1 ms apart so the run trace keeps the pipeline order.
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs);
  const finishedAt = at(fx.agentOutputs.length);

  await db.insert(schema.scenarios).values({ ...fx.scenario });
  await db.insert(schema.actors).values(fx.actors.map((a) => ({ ...a, scenarioId: fx.BREXIT_SCENARIO_ID })));
  await db.insert(schema.decisionPoints).values(
    fx.decisionPoints.map(({ id, label, position, actorIds }) => ({
      id,
      label,
      position,
      actorIds,
      scenarioId: fx.BREXIT_SCENARIO_ID,
    })),
  );
  await db.insert(schema.options).values(
    fx.decisionPoints.flatMap((dp) =>
      dp.options.map(({ id, label, position }) => ({ id, label, position, decisionPointId: dp.id })),
    ),
  );
  await db.insert(schema.runs).values({
    id: runId,
    scenarioId: fx.BREXIT_SCENARIO_ID,
    status: "completed",
    costUsd: 0,
    startedAt: now,
    finishedAt,
  });
  await db.insert(schema.agentOutputs).values(
    fx.agentOutputs.map((o, i) => ({
      runId,
      agentRole: o.agentRole,
      model: fx.FIXTURE_MODEL,
      outputJson: o.output,
      rationale: o.rationale,
      createdAt: at(i),
    })),
  );
  await db.insert(schema.constraintScores).values(
    fx.decisionPoints.flatMap((dp) =>
      dp.options.flatMap((option) =>
        (Object.keys(option.scores) as Array<keyof typeof option.scores>).map((lens) => ({
          runId,
          optionId: option.id,
          lens,
          score: option.scores[lens],
          rationale: fx.lensFindings[lens],
        })),
      ),
    ),
  );
  await db.insert(schema.forecasts).values(fx.forecasts.map((f) => ({ ...f, runId, createdAt: finishedAt })));

  return { seeded: true, runId };
}
