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

/**
 * Neon's Vercel integration writes `sslmode=require`, which `pg` flags with a
 * security warning on every cold start. Neon serves publicly trusted
 * certificates, so the stricter `verify-full` works unchanged; upgrade it.
 * Anything that is not a Neon URL is returned untouched.
 */
export function upgradeNeonSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.hostname.endsWith(".neon.tech") && url.searchParams.get("sslmode") === "require") {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // not a URL-shaped connection string; leave it to pg
  }
  return connectionString;
}

export function getPool(): Pool {
  if (!globalForDb.__pgPool) {
    // Small pool: on Vercel every function instance has its own, and a
    // managed Postgres (Neon) pools server-side behind the `-pooler` host.
    const pool = new Pool({
      connectionString: upgradeNeonSslMode(getEnv().DATABASE_URL),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    // Neon scales to zero after inactivity and drops idle connections; an
    // unhandled pool error would crash the process instead of reconnecting.
    pool.on("error", (err) => console.error("[db] idle client error", err));
    globalForDb.__pgPool = pool;
  }
  return globalForDb.__pgPool;
}

export function getDb() {
  globalForDb.__db ??= createDb(getPool());
  return globalForDb.__db;
}
