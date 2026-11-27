import { after } from "next/server";

import { chatRequestSchema } from "@/lib/validation/voice";
import { requireSession } from "@/server/auth/session";
import { handle, json } from "@/server/http/respond";
import { getAppointment } from "@/server/services/appointments";
import { getSalonDtosByIds } from "@/server/services/salons";
import { sendAppointmentConfirmation } from "@/server/sms/appointments";
import { runAssistant } from "@/server/voice/assistant";
import { isOpenAIError } from "@/server/voice/openai";
import { buildSystemPrompt, currentUtcDateTime } from "@/server/voice/prompts";
import { createOpenAIProvider } from "@/server/voice/providers/openai";
import { createDrizzleRepo } from "@/server/voice/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = handle(async (req: Request) => {
  const { user } = await requireSession();
  const raw: unknown = await req.json().catch(() => ({}));
  const body = chatRequestSchema.parse(raw);

  const salonId = user.salons[0];
  if (salonId === undefined) {
    return json({ error: "No salon associated with your account." }, { status: 400 });
  }
  const [salon] = await getSalonDtosByIds([salonId]);

  const systemPrompt = buildSystemPrompt({
    currentDateTime: currentUtcDateTime(),
    salonName: salon?.name ?? "",
    salonId,
    userName: user.full_name || user.email,
  });

  let result;
  try {
    result = await runAssistant({
      systemPrompt,
      history: body.conversation_history,
      message: body.message,
      ctx: { salonId, user },
      repo: createDrizzleRepo(user),
      provider: createOpenAIProvider(),
    });
  } catch (err) {
    if (!isOpenAIError(err)) throw err;
    console.error("Chat failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: `Chat failed: ${message}` }, { status: 502 });
  }

  const data: Record<string, unknown> = {
    reply: result.reply,
    conversation_history: result.history,
  };

  if (result.createdAppointmentIds.length > 0) {
    data.appointments = await Promise.all(
      result.createdAppointmentIds.map((id) => getAppointment(user, id))
    );
    for (const id of result.createdAppointmentIds) {
      after(() => sendAppointmentConfirmation(id));
    }
  }

  return json(data);
});
