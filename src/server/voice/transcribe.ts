import "server-only";

import { getEnv } from "@/server/env";
import { ApiError } from "@/server/http/errors";
import { getOpenAI } from "./openai";

export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
]);

const fieldError = (field: string, message: string) =>
  new ApiError(400, { [field]: [message] });

/** Pure request validation; mirrors the Django TranscribeRequestSerializer. */
export function validateAudio(
  file: unknown,
  language: unknown
): { file: File; language: string } {
  if (!(file instanceof File)) throw fieldError("audio", "No file was submitted.");
  if (language !== undefined && typeof language !== "string") {
    throw fieldError("language", "Not a valid string.");
  }
  if (file.size > MAX_AUDIO_SIZE) {
    throw fieldError(
      "audio",
      `File too large. Max size is ${MAX_AUDIO_SIZE / (1024 * 1024)} MB.`
    );
  }
  // Browsers send e.g. "audio/webm;codecs=opus"; compare the bare MIME type.
  const type = file.type.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(type)) {
    throw fieldError(
      "audio",
      `Unsupported audio format: ${type}. Allowed: mp3, mp4, wav, webm, ogg, m4a.`
    );
  }
  return { file, language: language === undefined || language === "" ? "en" : language };
}

export async function transcribeAudio(file: File, language: string): Promise<string> {
  const result = await getOpenAI().audio.transcriptions.create({
    model: getEnv().OPENAI_WHISPER_MODEL,
    file,
    language,
  });
  return result.text;
}
