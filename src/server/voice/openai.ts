import "server-only";
import OpenAI from "openai";

import { getEnv } from "@/server/env";
import { ApiError } from "@/server/http/errors";

let client: OpenAI | undefined;

/** Lazy memoised OpenAI client; 502 when the key is not configured. */
export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = getEnv().OPENAI_API_KEY;
  if (!apiKey) {
    throw new ApiError(502, { error: "Voice service is not configured." });
  }
  client = new OpenAI({ apiKey });
  return client;
}

/** True for any error raised by the OpenAI SDK (API, connection, timeout). */
export function isOpenAIError(err: unknown): boolean {
  return err instanceof OpenAI.OpenAIError;
}
