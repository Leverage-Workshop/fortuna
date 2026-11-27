import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { getPool } from "./pool";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { fortunaDb?: Db };

/** Typed Drizzle client over the shared pg pool. */
export function getDb(): Db {
  globalForDb.fortunaDb ??= drizzle(getPool(), { schema });
  return globalForDb.fortunaDb;
}
