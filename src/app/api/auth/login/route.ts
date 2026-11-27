import { NextResponse } from "next/server";
import { z } from "zod";

import { setAuthCookies } from "@/server/auth/cookies";
import { signAccessToken, signRefreshToken } from "@/server/auth/jwt";
import { verifyPassword } from "@/server/auth/password";
import { clientKey, loginLimiter } from "@/server/auth/rate-limit";
import { ApiError } from "@/server/http/errors";
import { handle } from "@/server/http/respond";
import {
  findUserByEmail,
  getUserDto,
  touchLastLogin,
} from "@/server/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Verified against when the email is unknown so both paths cost one PBKDF2 run.
const DUMMY_HASH =
  "pbkdf2_sha256$1000000$2T9F2unzW77lPcG8NM7nIM$ptNUvFuklF9EOrN9vWUyIHEKl1hpvh4i9uhlOWTMU5s=";

const invalidCredentials = () =>
  new ApiError(400, {
    non_field_errors: ["Unable to log in with provided credentials."],
  });

export const POST = handle(async (req: Request) => {
  if (!loginLimiter().attempt(clientKey(req.headers))) {
    throw new ApiError(429, {
      detail: "Too many login attempts. Try again later.",
    });
  }

  const raw: unknown = await req.json().catch(() => ({}));
  const { email, password } = bodySchema.parse(raw);

  const found = await findUserByEmail(email);
  const ok = await verifyPassword(password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !ok || !found.row.isActive) throw invalidCredentials();

  await touchLastLogin(found.row.id);
  const user = await getUserDto(found.row.id);
  if (!user) throw invalidCredentials();

  const [access, refresh] = await Promise.all([
    signAccessToken(user.id),
    signRefreshToken(user.id),
  ]);
  const res = NextResponse.json({ user });
  setAuthCookies(res, access, refresh);
  return res;
});
