import { requireSession } from "@/server/auth/session";
import { ApiError } from "@/server/http/errors";
import { handle, json } from "@/server/http/respond";
import { isOpenAIError } from "@/server/voice/openai";
import { transcribeAudio, validateAudio } from "@/server/voice/transcribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = handle(async (req: Request) => {
  await requireSession();
  const form = await req.formData().catch(() => {
    throw new ApiError(400, { audio: ["No file was submitted."] });
  });
  const { file, language } = validateAudio(
    form.get("audio"),
    form.get("language") ?? undefined
  );
  try {
    return json({ text: await transcribeAudio(file, language) });
  } catch (err) {
    if (!isOpenAIError(err)) throw err;
    console.error("Transcription failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: `Transcription failed: ${message}` }, { status: 502 });
  }
});
