import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

import { unauthorized } from "@/server/http/errors";
import { getUserDto, type UserDto } from "@/server/services/users";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";
import { verifyToken } from "./jwt";

export type Session = { user: UserDto; needsRotation: boolean };

/** Resolves the session for the current request; cached so layout and page share one lookup. */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();

  let userId: number | null = null;
  let needsRotation = false;

  const access = store.get(ACCESS_COOKIE)?.value;
  const accessClaims = access ? await verifyToken(access, "access") : null;
  if (accessClaims) {
    userId = accessClaims.userId;
  } else {
    const refresh = store.get(REFRESH_COOKIE)?.value;
    const refreshClaims = refresh ? await verifyToken(refresh, "refresh") : null;
    if (refreshClaims) {
      userId = refreshClaims.userId;
      needsRotation = true;
    }
  }
  if (userId === null) return null;

  const user = await getUserDto(userId);
  if (!user || !user.is_active) return null;
  return { user, needsRotation };
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}
