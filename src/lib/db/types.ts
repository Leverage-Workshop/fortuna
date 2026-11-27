import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type * as schema from "./schema/index.ts";

/**
 * A typed Drizzle handle over the Fortuna schema: the pooled client from `getDb()`, a
 * single-connection client in scripts and tests, or a transaction from either.
 */
export type AppDb = PgDatabase<NodePgQueryResultHKT, typeof schema>;
