import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/lib/db/schema";
import type { AppDb } from "@/lib/db/types";
import type { RunListItem, RunReport } from "./types";

const runIdSchema = z.uuid();

/** Reads one run and everything the report's built sections show. Null if the run doesn't exist. */
export async function loadRunReport(db: AppDb, runId: string): Promise<RunReport | null> {
  if (!runIdSchema.safeParse(runId).success) {
    return null;
  }

  const [row] = await db
    .select({ run: schema.runs, scenario: schema.scenarios })
    .from(schema.runs)
    .innerJoin(schema.scenarios, eq(schema.runs.scenarioId, schema.scenarios.id))
    .where(eq(schema.runs.id, runId));
  if (!row) {
    return null;
  }
  const { run, scenario } = row;

  // Sequential on purpose: `db` may be one connection or a transaction, which can't run
  // queries concurrently.
  const forecasts = await db
    .select({
      id: schema.forecasts.id,
      outcome: schema.forecasts.outcome,
      probability: schema.forecasts.probability,
      baselineProbability: schema.forecasts.baselineProbability,
      overrideReason: schema.forecasts.overrideReason,
    })
    .from(schema.forecasts)
    .where(eq(schema.forecasts.runId, run.id))
    .orderBy(desc(schema.forecasts.probability), asc(schema.forecasts.outcome));
  const agentOutputs = await db
    .select({
      id: schema.agentOutputs.id,
      agentRole: schema.agentOutputs.agentRole,
      model: schema.agentOutputs.model,
      inputTokens: schema.agentOutputs.inputTokens,
      outputTokens: schema.agentOutputs.outputTokens,
      costUsd: schema.agentOutputs.costUsd,
      durationMs: schema.agentOutputs.durationMs,
    })
    .from(schema.agentOutputs)
    .where(eq(schema.agentOutputs.runId, run.id))
    .orderBy(asc(schema.agentOutputs.createdAt), asc(schema.agentOutputs.id));
  const actors = await db
    .select({
      id: schema.actors.id,
      name: schema.actors.name,
      regimeType: schema.actors.regimeType,
      profile: schema.actors.profile,
    })
    .from(schema.actors)
    .where(eq(schema.actors.scenarioId, scenario.id))
    .orderBy(asc(schema.actors.name));
  const points = await db
    .select()
    .from(schema.decisionPoints)
    .where(eq(schema.decisionPoints.scenarioId, scenario.id))
    .orderBy(asc(schema.decisionPoints.position));
  const options = await db
    .select({
      id: schema.options.id,
      decisionPointId: schema.options.decisionPointId,
      label: schema.options.label,
      position: schema.options.position,
    })
    .from(schema.options)
    .innerJoin(schema.decisionPoints, eq(schema.options.decisionPointId, schema.decisionPoints.id))
    .where(eq(schema.decisionPoints.scenarioId, scenario.id))
    .orderBy(asc(schema.options.position));

  const actorName = new Map(actors.map((a) => [a.id, a.name]));

  return {
    run: {
      id: run.id,
      status: run.status,
      eveSessionId: run.eveSessionId,
      costUsd: run.costUsd,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
    },
    scenario: {
      id: scenario.id,
      text: scenario.text,
      asOf: scenario.asOf,
      horizon: scenario.horizon,
      resolutionQuestion: scenario.resolutionQuestion,
      contaminated: scenario.contaminated,
    },
    forecasts,
    agentOutputs,
    actors,
    decisionPoints: points.map((dp) => ({
      id: dp.id,
      label: dp.label,
      position: dp.position,
      actorNames: dp.actorIds.flatMap((id) => actorName.get(id) ?? []),
      options: options
        .filter((o) => o.decisionPointId === dp.id)
        .map(({ id, label, position }) => ({ id, label, position })),
    })),
  };
}

/** The most recent runs with their scenario, newest first. */
export async function listRuns(db: AppDb, limit = 50): Promise<RunListItem[]> {
  return db
    .select({
      id: schema.runs.id,
      status: schema.runs.status,
      startedAt: schema.runs.startedAt,
      scenarioText: schema.scenarios.text,
      asOf: schema.scenarios.asOf,
      contaminated: schema.scenarios.contaminated,
    })
    .from(schema.runs)
    .innerJoin(schema.scenarios, eq(schema.runs.scenarioId, schema.scenarios.id))
    .orderBy(desc(schema.runs.startedAt))
    .limit(limit);
}
