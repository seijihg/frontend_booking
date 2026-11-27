import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/server/auth/cookies";
import { signAccessToken, signRefreshToken, verifyToken } from "@/server/auth/jwt";

/**
 * Rotates cookies when the access token is missing/expired but the refresh
 * token is valid (fixes D7). No database access: the refresh token is trusted
 * on signature and expiry alone, and `getSession()` still checks the user.
 */
export async function middleware(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access && (await verifyToken(access, "access"))) {
    return NextResponse.next();
  }

  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const claims = refresh ? await verifyToken(refresh, "refresh") : null;
  if (!claims) return NextResponse.next();

  const [newAccess, newRefresh] = await Promise.all([
    signAccessToken(claims.userId),
    signRefreshToken(claims.userId),
  ]);

  // Make the fresh access token visible to RSC and handlers in this same request.
  const headers = new Headers(req.headers);
  const rewritten = req.cookies
    .getAll()
    .filter((c) => c.name !== ACCESS_COOKIE)
    .map((c) => `${c.name}=${c.value}`);
  rewritten.push(`${ACCESS_COOKIE}=${newAccess}`);
  headers.set("cookie", rewritten.join("; "));

  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(ACCESS_COOKIE, newAccess, accessCookieOptions());
  res.cookies.set(REFRESH_COOKIE, newRefresh, refreshCookieOptions());
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
