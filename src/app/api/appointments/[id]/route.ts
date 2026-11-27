import { after } from "next/server";

import { appointmentPatchSchema } from "@/lib/validation/appointment";
import { requireSession } from "@/server/auth/session";
import { notFound } from "@/server/http/errors";
import { handle, json, noContent } from "@/server/http/respond";
import {
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from "@/server/services/appointments";
import {
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
} from "@/server/sms/appointments";

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
  return json(await getAppointment(user, id));
});

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { user, id } = await resolve(ctx);
  const raw: unknown = await req.json().catch(() => ({}));
  const patch = appointmentPatchSchema.parse(raw);
  const { dto, timeChanged } = await updateAppointment(user, id, patch);
  if (timeChanged) after(() => sendAppointmentConfirmation(dto.id));
  return json(dto);
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const { user, id } = await resolve(ctx);
  const snapshot = await deleteAppointment(user, id);
  after(() => sendAppointmentCancellation(snapshot));
  return noContent();
});
