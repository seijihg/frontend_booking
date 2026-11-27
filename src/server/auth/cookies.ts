import "server-only";
import type { NextResponse } from "next/server";

import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "./jwt";

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refresh_token";

function baseOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export const accessCookieOptions = () => baseOptions(ACCESS_TTL_SECONDS);
export const refreshCookieOptions = () => baseOptions(REFRESH_TTL_SECONDS);

export function setAuthCookies(
  res: NextResponse,
  access: string,
  refresh: string
): void {
  res.cookies.set(ACCESS_COOKIE, access, accessCookieOptions());
  res.cookies.set(REFRESH_COOKIE, refresh, refreshCookieOptions());
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...accessCookieOptions(), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...refreshCookieOptions(), maxAge: 0 });
}
