import { customerPatchSchema } from "@/lib/validation/customer";
import { requireSession } from "@/server/auth/session";
import { notFound } from "@/server/http/errors";
import { handle, json, noContent } from "@/server/http/respond";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/server/services/customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function resolve(ctx: Ctx) {
  const { user } = await requireSession();
  const { id: rawId } = await ctx.params;
  if (!/^\d+$/.test(rawId)) throw notFound();
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) throw notFound();
  return { user, id };
}

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { user, id } = await resolve(ctx);
  return json(await getCustomer(user, id));
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { user, id } = await resolve(ctx);
  const raw: unknown = await req.json().catch(() => ({}));
  const patch = customerPatchSchema.parse(raw);
  return json(await updateCustomer(user, id, patch));
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const { user, id } = await resolve(ctx);
  await deleteCustomer(user, id);
  return noContent();
});
