import { pgEnum } from "drizzle-orm/pg-core";

/** Regime type the parser tags on each actor; picks the political lens checklist (PRD "Framework encoding"). */
export const regimeType = pgEnum("regime_type", ["democratic", "authoritarian", "hybrid"]);

export const runStatus = pgEnum("run_status", [
  "pending",
  "awaiting_approval",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

/** The nine agent roles in PRD "Agent architecture". Handoff-document allowlists are keyed on these. */
export const agentRole = pgEnum("agent_role", [
  "scenario_parser",
  "actor",
  "political_constraint",
  "economic_constraint",
  "geopolitical_constraint",
  "legal_constraint",
  "consensus",
  "judge",
  "market_mapper",
]);

/** The four constraint lenses, highest in the hierarchy first. */
export const constraintLens = pgEnum("constraint_lens", ["political", "economic", "geopolitical", "legal"]);

export const venue = pgEnum("venue", ["kalshi", "polymarket"]);
