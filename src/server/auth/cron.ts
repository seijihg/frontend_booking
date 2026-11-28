import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Checks `Authorization: Bearer <CRON_SECRET>` in constant time. */
export function authorizeCron(
  authorizationHeader: string | null,
  secret: string | undefined
): "ok" | "unconfigured" | "unauthorized" {
  if (!secret) return "unconfigured";
  if (!authorizationHeader) return "unauthorized";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorizationHeader);
  if (given.length !== expected.length) return "unauthorized";
  return timingSafeEqual(given, expected) ? "ok" : "unauthorized";
}
