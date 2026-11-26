export type DbStatus = { ok: true; postgresVersion: string } | { ok: false; error: string };

type Queryable = {
  query: (sql: string) => Promise<{ rows: Record<string, unknown>[] }>;
};

/** Round trip to the database that reports the server's Postgres version. */
export async function checkDatabase(db: Queryable): Promise<DbStatus> {
  const { rows } = await db.query("SELECT current_setting('server_version') AS postgres_version");
  const version = rows[0]?.postgres_version;

  if (typeof version !== "string") {
    return { ok: false, error: "server_version not reported" };
  }
  return { ok: true, postgresVersion: version };
}
