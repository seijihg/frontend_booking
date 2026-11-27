import { sql } from "drizzle-orm";

import { getDb } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", db: "ok" });
  } catch (err) {
    console.error("[health] database check failed", err);
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
