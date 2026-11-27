import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "@/server/auth/cookies";
import { signAccessToken, signRefreshToken, verifyToken } from "@/server/auth/jwt";
import { unauthorized } from "@/server/http/errors";
import { handle } from "@/server/http/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;
  const claims = token ? await verifyToken(token, "refresh") : null;
  if (!claims) {
    const res = NextResponse.json(unauthorized().body, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const [access, refresh] = await Promise.all([
    signAccessToken(claims.userId),
    signRefreshToken(claims.userId),
  ]);
  const res = NextResponse.json({ detail: "Token refreshed." });
  setAuthCookies(res, access, refresh);
  return res;
});
