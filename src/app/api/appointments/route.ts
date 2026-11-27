import { after } from "next/server";

import {
  appointmentCreateSchema,
  appointmentListQuerySchema,
} from "@/lib/validation/appointment";
import { requireSession } from "@/server/auth/session";
import { handle, json } from "@/server/http/respond";
import { sendAppointmentConfirmation } from "@/server/sms/appointments";
import { createAppointment, listAppointments } from "@/server/services/appointments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const { user } = await requireSession();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = appointmentListQuerySchema.parse(params);
  return json(await listAppointments(user, query));
});

export const POST = handle(async (req: Request) => {
  const { user } = await requireSession();
  const raw: unknown = await req.json().catch(() => ({}));
  const input = appointmentCreateSchema.parse(raw);
  const dto = await createAppointment(user, input);
  after(() => sendAppointmentConfirmation(dto.id));
  return json(dto, { status: 201 });
});
