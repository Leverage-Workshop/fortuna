import { sql } from "drizzle-orm";
import { boolean, check, date, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { regimeType } from "./enums";

/**
 * A user's question and its as-of date. `contaminated` has no default: the caller must say
 * whether the outcome may already be known, because contaminated forecasts are never scored.
 * `horizon` and `resolution_question` stay null until the parser fills them.
 */
export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  asOf: date("as_of").notNull(),
  horizon: date("horizon"),
  resolutionQuestion: text("resolution_question"),
  contaminated: boolean("contaminated").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const actors = pgTable(
  "actors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    regimeType: regimeType("regime_type").notNull(),
    profile: text("profile"),
  },
  (t) => [unique("actors_scenario_name_key").on(t.scenarioId, t.name)],
).enableRLS();

/**
 * One choice point in the tree. Joint decisions list several actors in `actor_ids`; Postgres
 * can't foreign-key array elements, so the parser checks they belong to the same scenario.
 * The PRD's `order` field is `position` here, since ORDER is a reserved word.
 */
export const decisionPoints = pgTable(
  "decision_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    actorIds: uuid("actor_ids").array().notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    unique("decision_points_scenario_position_key").on(t.scenarioId, t.position),
    check("decision_points_actor_ids_nonempty", sql`cardinality(${t.actorIds}) >= 1`),
  ],
).enableRLS();

export const options = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    decisionPointId: uuid("decision_point_id")
      .notNull()
      .references(() => decisionPoints.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [unique("options_decision_point_position_key").on(t.decisionPointId, t.position)],
).enableRLS();
