import "server-only";
import { SignJWT, jwtVerify } from "jose";

import { getEnv } from "@/server/env";

export const ACCESS_TTL_SECONDS = 3600;
export const REFRESH_TTL_SECONDS = 604800;

export type TokenType = "access" | "refresh";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

async function sign(
  userId: number,
  tokenType: TokenType,
  ttlSeconds: number
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  return new SignJWT({ token_type: tokenType, user_id: userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttlSeconds)
    .setJti(crypto.randomUUID().replaceAll("-", ""))
    .sign(secretKey());
}

export const signAccessToken = (userId: number) =>
  sign(userId, "access", ACCESS_TTL_SECONDS);

export const signRefreshToken = (userId: number) =>
  sign(userId, "refresh", REFRESH_TTL_SECONDS);

/** Returns the user id, or null on bad signature, expiry, wrong type or bad claims. Never throws. */
export async function verifyToken(
  token: string,
  expected: TokenType
): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.token_type !== expected) return null;
    const userId = payload.user_id;
    if (typeof userId !== "number" || !Number.isSafeInteger(userId)) return null;
    return { userId };
  } catch {
    return null;
  }
}
