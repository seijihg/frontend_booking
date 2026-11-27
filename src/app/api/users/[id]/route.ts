import { z } from "zod";

import { requireSession } from "@/server/auth/session";
import { ApiError, notFound } from "@/server/http/errors";
import { handle, json } from "@/server/http/respond";
import {
  canAccessUser,
  getUserDto,
  updateUser,
  type UserPatch,
} from "@/server/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const OWNER_ONLY_FIELDS = ["is_owner", "is_staff", "is_active"] as const;

const patchSchema = z
  .object({
    first_name: z.string().max(150),
    last_name: z.string().max(150),
    full_name: z.string().max(150),
    phone_number: z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number."),
    is_owner: z.boolean(),
    is_staff: z.boolean(),
    is_active: z.boolean(),
  })
  .partial()
  .strict();

async function resolveTarget(ctx: Ctx) {
  const session = await requireSession();
  const { id: rawId } = await ctx.params;
  if (!/^\d+$/.test(rawId)) throw notFound();
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || !(await canAccessUser(session, id))) {
    throw notFound();
  }
  return { session, id };
}

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await resolveTarget(ctx);
  const user = await getUserDto(id);
  if (!user) throw notFound();
  return json({ user });
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { session, id } = await resolveTarget(ctx);
  const raw: unknown = await req.json().catch(() => ({}));
  const patch: UserPatch = patchSchema.parse(raw);

  if (!session.user.is_owner) {
    const denied: Record<string, string[]> = {};
    for (const field of OWNER_ONLY_FIELDS) {
      if (patch[field] !== undefined) {
        denied[field] = ["You do not have permission to change this field."];
      }
    }
    if (Object.keys(denied).length > 0) throw new ApiError(400, denied);
  }

  const user = await updateUser(id, patch);
  if (!user) throw notFound();
  return json(user);
});
