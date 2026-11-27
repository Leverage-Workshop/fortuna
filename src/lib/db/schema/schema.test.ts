import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import * as schema from "./index";

// The twelve tables in PRD "Data model".
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

const tables = Object.values(schema as Record<string, unknown>)
  .filter((value): value is PgTable => value instanceof PgTable)
  .map((table) => getTableConfig(table));

describe("schema", () => {
  test("defines exactly the PRD's twelve tables", () => {
    expect(tables.map((t) => t.name).sort()).toEqual(PRD_TABLES);
  });

  test("enables row-level security on every table", () => {
    const withoutRls = tables.filter((t) => !t.enableRLS).map((t) => t.name);
    expect(withoutRls).toEqual([]);
  });

  test("forecasts can't be removed by deleting their run", () => {
    const forecasts = getTableConfig(schema.forecasts);
    const runFk = forecasts.foreignKeys.find((fk) => fk.reference().foreignTable === schema.runs);
    expect(runFk?.onDelete).toBe("restrict");
  });
});
