import { authorizeCron } from "@/server/auth/cron";
import { getEnv } from "@/server/env";
import { handle, json } from "@/server/http/respond";
import { createDrizzleReminderRepo, runReminderSweep } from "@/server/sms/reminders";
import { sendSms } from "@/server/sms/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron issues GET; POST is allowed for manual triggering.
const run = handle(async (request: Request) => {
  const auth = authorizeCron(request.headers.get("authorization"), getEnv().CRON_SECRET);
  if (auth === "unconfigured") return json({ detail: "Cron is not configured." }, { status: 503 });
  if (auth === "unauthorized") {
    return json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  }

  const result = await runReminderSweep(createDrizzleReminderRepo(), sendSms);
  console.info("[jobs] reminders sweep", result);
  return json(result);
});

export const GET = run;
export const POST = run;
