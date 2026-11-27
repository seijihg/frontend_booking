import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnvForTests } from "@/server/env";
import { signAccessToken, signRefreshToken, verifyToken } from "./jwt";

const SECRET = "s".repeat(40);

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5433/db");
  vi.stubEnv("AUTH_SECRET", SECRET);
  resetEnvForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvForTests();
});

describe("jwt", () => {
  it("round-trips an access token with SimpleJWT claims", async () => {
    const token = await signAccessToken(7);
    expect(await verifyToken(token, "access")).toEqual({ userId: 7 });
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    expect(payload.token_type).toBe("access");
    expect(payload.jti).toMatch(/^[0-9a-f]{32}$/);
    expect(payload.exp - payload.iat).toBe(3600);
  });

  it("rejects a refresh token where access is expected and vice versa", async () => {
    const refresh = await signRefreshToken(7);
    expect(await verifyToken(refresh, "access")).toBeNull();
    expect(await verifyToken(refresh, "refresh")).toEqual({ userId: 7 });
  });

  it("rejects a tampered payload", async () => {
    const [h, , s] = (await signAccessToken(7)).split(".");
    const forged = Buffer.from(
      JSON.stringify({ token_type: "access", user_id: 1, exp: 9999999999 })
    ).toString("base64url");
    expect(await verifyToken(`${h}.${forged}.${s}`, "access")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await new SignJWT({ token_type: "access", user_id: 7 })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now - 7200)
      .setExpirationTime(now - 3600)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifyToken(expired, "access")).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifyToken("not-a-jwt", "access")).toBeNull();
  });
});
