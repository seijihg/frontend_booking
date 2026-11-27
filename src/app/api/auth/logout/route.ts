import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/server/auth/cookies";
import { handle } from "@/server/http/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  const res = NextResponse.json({ detail: "Successfully logged out." });
  clearAuthCookies(res);
  return res;
});
