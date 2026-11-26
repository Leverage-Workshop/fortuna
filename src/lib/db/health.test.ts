import { describe, expect, test } from "vitest";
import { checkDatabase } from "./health";

const fakeDb = (row: Record<string, unknown>) => ({ query: async () => ({ rows: [row] }) });

describe("checkDatabase", () => {
  test("reports the server version", async () => {
    const status = await checkDatabase(fakeDb({ postgres_version: "17.6" }));
    expect(status).toEqual({ ok: true, postgresVersion: "17.6" });
  });

  test("fails when no version comes back", async () => {
    const status = await checkDatabase(fakeDb({}));
    expect(status.ok).toBe(false);
  });
});
