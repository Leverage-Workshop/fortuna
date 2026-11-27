import { sql } from "drizzle-orm";
import { boolean, check, doublePrecision, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { venue } from "./enums.ts";
import { scenarios } from "./scenarios.ts";

/** A Kalshi or Polymarket contract matched to a scenario, with its resolution-rule fit (0–1). */
export const marketLinks = pgTable(
  "market_links",
  {
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    venue: venue("venue").notNull(),
    contractId: text("contract_id").notNull(),
    matchScore: doublePrecision("match_score").notNull(),
    confirmedByUser: boolean("confirmed_by_user").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "market_links_pkey", columns: [t.scenarioId, t.venue, t.contractId] }),
    check("market_links_match_score_range", sql`${t.matchScore} BETWEEN 0 AND 1`),
  ],
).enableRLS();

/**
 * Price history per contract: daily, plus one at forecast time. Keyed by venue as well as
 * contract ID because the two venues' ID spaces are independent. Not tied to a scenario, since
 * several scenarios can link the same contract.
 */
export const marketSnapshots = pgTable(
  "market_snapshots",
  {
    venue: venue("venue").notNull(),
    contractId: text("contract_id").notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    midPrice: doublePrecision("mid_price").notNull(),
    volume: doublePrecision("volume"),
  },
  (t) => [
    primaryKey({ name: "market_snapshots_pkey", columns: [t.venue, t.contractId, t.ts] }),
    check("market_snapshots_mid_price_range", sql`${t.midPrice} BETWEEN 0 AND 1`),
    check("market_snapshots_volume_nonnegative", sql`${t.volume} IS NULL OR ${t.volume} >= 0`),
  ],
).enableRLS();
