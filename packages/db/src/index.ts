import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export { schema };
export type Database = NodePgDatabase<typeof schema>;

export interface DbHandle {
  db: Database;
  pool: pg.Pool;
  close(): Promise<void>;
}

// Return numeric/bigint columns as strings so no financial value passes through a JS float.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => v);
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => v);

export function createDb(connectionString: string, opts: { max?: number; applicationName?: string } = {}): DbHandle {
  const pool = new pg.Pool({ connectionString, max: opts.max ?? 10, application_name: opts.applicationName ?? "tokeniq" });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  return { db, pool, close: () => pool.end() };
}

export * from "drizzle-orm";
