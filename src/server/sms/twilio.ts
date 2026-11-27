import "server-only";

import { getEnv } from "@/server/env";

export function isSmsConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}

/** Sends an SMS. Never throws: failures are logged and reported as "failed". "skipped" when Twilio is not configured. */
export type SmsResult = "sent" | "skipped" | "failed";

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  try {
    if (!isSmsConfigured()) {
      console.info("[sms] skipped (Twilio not configured)", { to });
      return "skipped";
    }
    const env = getEnv();
    const { default: twilio } = await import("twilio");
    await twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN).messages.create({
      to,
      from: env.TWILIO_PHONE_NUMBER,
      body,
    });
    return "sent";
  } catch (err) {
    console.error("[sms] send failed", err);
    return "failed";
  }
}
