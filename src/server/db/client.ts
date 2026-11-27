import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/server/env";
import * as schema from "./schema";
import * as relations from "./relations";

// Cached on globalThis so Next dev hot reload does not leak pools. Created
// lazily so `next build` does not need DATABASE_URL.
const globalForDb = globalThis as unknown as {
  __pgPool?: Pool;
  __db?: ReturnType<typeof createDb>;
};

function createDb(pool: Pool) {
  return drizzle(pool, { schema: { ...schema, ...relations } });
}

export function getPool(): Pool {
  globalForDb.__pgPool ??= new Pool({ connectionString: getEnv().DATABASE_URL });
  return globalForDb.__pgPool;
}

export function getDb() {
  globalForDb.__db ??= createDb(getPool());
  return globalForDb.__db;
}
