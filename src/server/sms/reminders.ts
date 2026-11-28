import "server-only";
import { and, eq, gt, inArray, isNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { appointmentAppointment, salonSalon } from "@/server/db/schema";
import { loadSmsContext, type SmsContext } from "@/server/services/appointments";
import { reminderText } from "./templates";

export function reminderDueAt(appointmentTimeIso: string, reminderMinutes: number): Date {
  return new Date(new Date(appointmentTimeIso).getTime() - reminderMinutes * 60_000);
}

/** Due once the reminder moment has passed, but never for an appointment that already started. */
export function isReminderDue(
  appointmentTimeIso: string,
  reminderMinutes: number,
  now: Date
): boolean {
  return (
    reminderDueAt(appointmentTimeIso, reminderMinutes).getTime() <= now.getTime() &&
    new Date(appointmentTimeIso).getTime() > now.getTime()
  );
}

export interface ReminderRepo {
  /** Atomically stamps and returns the ids of appointments whose reminder is due. */
  claimDue(now: Date): Promise<number[]>;
  /** Clears the stamp so the next sweep retries. */
  release(ids: number[]): Promise<void>;
  loadContext(id: number): Promise<SmsContext | null>;
}

export type SweepResult = { claimed: number; sent: number; skipped: number; failed: number };

type Send = (to: string, body: string) => Promise<"sent" | "skipped" | "failed">;

/** Never throws for per-row problems. */
export async function runReminderSweep(
  repo: ReminderRepo,
  send: Send,
  now = new Date()
): Promise<SweepResult> {
  const ids = await repo.claimDue(now);
  const result: SweepResult = { claimed: ids.length, sent: 0, skipped: 0, failed: 0 };

  for (const id of ids) {
    try {
      const ctx = await repo.loadContext(id);
      if (!ctx || !ctx.customerPhone) {
        console.info("[sms] reminder skipped (no appointment context or phone)", { id });
        result.skipped++;
        continue;
      }
      const outcome = await send(ctx.customerPhone, reminderText(ctx));
      if (outcome === "sent") {
        result.sent++;
      } else if (outcome === "skipped") {
        result.skipped++;
      } else {
        result.failed++;
        await repo.release([id]);
      }
    } catch (err) {
      console.error("[sms] reminder failed", { id, err });
      result.failed++;
      try {
        await repo.release([id]);
      } catch (releaseErr) {
        console.error("[sms] reminder release failed", { id, releaseErr });
      }
    }
  }
  return result;
}

export function createDrizzleReminderRepo(): ReminderRepo {
  return {
    async claimDue(now) {
      const nowIso = now.toISOString();
      const rows = await getDb()
        .update(appointmentAppointment)
        .set({ reminderSentAt: nowIso })
        .from(salonSalon)
        .where(
          and(
            eq(salonSalon.id, appointmentAppointment.salonId),
            isNull(appointmentAppointment.reminderSentAt),
            gt(appointmentAppointment.appointmentTime, nowIso),
            sql`${appointmentAppointment.appointmentTime} - make_interval(mins => ${salonSalon.reminderTimeMinutes}) <= ${nowIso}::timestamptz`
          )
        )
        .returning({ id: appointmentAppointment.id });
      return rows.map((r) => r.id);
    },
    async release(ids) {
      if (ids.length === 0) return;
      await getDb()
        .update(appointmentAppointment)
        .set({ reminderSentAt: null })
        .where(inArray(appointmentAppointment.id, ids));
    },
    loadContext: loadSmsContext,
  };
}
