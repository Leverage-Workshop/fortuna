import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { agentRole, constraintLens, runStatus } from "./enums.ts";
import { options, scenarios } from "./scenarios.ts";

const usd = (name: string) => numeric(name, { precision: 12, scale: 6, mode: "number" });

/** One execution of a scenario. Re-runs add rows; each run's forecasts are a new version. */
export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    eveSessionId: text("eve_session_id"),
    status: runStatus("status").notNull().default("pending"),
    costUsd: usd("cost_usd").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("runs_scenario_id_idx").on(t.scenarioId),
    check("runs_cost_nonnegative", sql`${t.costUsd} >= 0`),
    check("runs_finished_after_start", sql`${t.finishedAt} IS NULL OR ${t.finishedAt} >= ${t.startedAt}`),
  ],
).enableRLS();

/** Raw structured output per agent, plus the usage the run-trace section reports. */
export const agentOutputs = pgTable(
  "agent_outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    agentRole: agentRole("agent_role").notNull(),
    model: text("model").notNull(),
    outputJson: jsonb("output_json").notNull(),
    rationale: text("rationale"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: usd("cost_usd"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_outputs_run_id_idx").on(t.runId)],
).enableRLS();

/** Every tool call an agent made; feeds the report's evidence ledger. `cutoff` is null for internal tools. */
export const toolCalls = pgTable(
  "tool_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    agentRole: agentRole("agent_role").notNull(),
    tool: text("tool").notNull(),
    argsJson: jsonb("args_json").notNull().default({}),
    cutoff: timestamp("cutoff", { withTimezone: true }),
    resultSummary: text("result_summary"),
    sourceUrl: text("source_url"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tool_calls_run_id_idx").on(t.runId)],
).enableRLS();

/**
 * Dossiers passed between agents by ID. RLS is on with no policies yet, so only the owner role
 * can read them; feat-004 adds the per-role allowlist policy.
 */
export const handoffDocuments = pgTable(
  "handoff_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    authorRole: agentRole("author_role").notNull(),
    markdown: text("markdown").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("handoff_documents_run_author_idx").on(t.runId, t.authorRole)],
).enableRLS();

/** One 0–4 score per option per lens (PRD "Scoring rubric"); evidence points at tool_calls. */
export const constraintScores = pgTable(
  "constraint_scores",
  {
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => options.id, { onDelete: "cascade" }),
    lens: constraintLens("lens").notNull(),
    score: smallint("score").notNull(),
    rationale: text("rationale").notNull(),
    evidenceToolCallIds: uuid("evidence_tool_call_ids").array().notNull().default(sql`'{}'::uuid[]`),
  },
  (t) => [
    primaryKey({ name: "constraint_scores_pkey", columns: [t.runId, t.optionId, t.lens] }),
    index("constraint_scores_option_id_idx").on(t.optionId),
    check("constraint_scores_score_range", sql`${t.score} BETWEEN 0 AND 4`),
  ],
).enableRLS();

/**
 * Outcome probabilities for a run. Immutable once written: a trigger (migration
 * 0001_forecasts_immutable) rejects UPDATE of these columns, DELETE and TRUNCATE, and the run
 * foreign key is RESTRICT so deleting a run can't remove its forecasts. A probability that
 * differs from the code baseline must carry the judge's override reason.
 */
export const forecasts = pgTable(
  "forecasts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "restrict" }),
    outcome: text("outcome").notNull(),
    probability: doublePrecision("probability").notNull(),
    baselineProbability: doublePrecision("baseline_probability"),
    overrideReason: text("override_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("forecasts_run_outcome_key").on(t.runId, t.outcome),
    check("forecasts_probability_range", sql`${t.probability} BETWEEN 0 AND 1`),
    check(
      "forecasts_baseline_range",
      sql`${t.baselineProbability} IS NULL OR ${t.baselineProbability} BETWEEN 0 AND 1`,
    ),
    check(
      "forecasts_override_has_reason",
      sql`${t.baselineProbability} IS NULL OR ${t.probability} = ${t.baselineProbability} OR ${t.overrideReason} IS NOT NULL`,
    ),
  ],
).enableRLS();
