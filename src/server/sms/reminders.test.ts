import { describe, expect, it, vi } from "vitest";

import {
  isReminderDue,
  reminderDueAt,
  runReminderSweep,
  type ReminderRepo,
} from "./reminders";
import type { SmsContext } from "@/server/services/appointments";

const appt = "2026-01-01T10:00:00.000Z";
const at = (iso: string) => new Date(iso);

describe("reminder window maths", () => {
  it("computes the reminder moment", () => {
    expect(reminderDueAt(appt, 30).toISOString()).toBe("2026-01-01T09:30:00.000Z");
  });
  it("is due exactly at the boundary", () => {
    expect(isReminderDue(appt, 30, at("2026-01-01T09:30:00.000Z"))).toBe(true);
  });
  it("is not due before the boundary", () => {
    expect(isReminderDue(appt, 30, at("2026-01-01T09:29:59.999Z"))).toBe(false);
  });
  it("is due inside the window", () => {
    expect(isReminderDue(appt, 30, at("2026-01-01T09:45:00.000Z"))).toBe(true);
  });
  it("is not due once the appointment has started", () => {
    expect(isReminderDue(appt, 30, at(appt))).toBe(false);
    expect(isReminderDue(appt, 30, at("2026-01-01T10:01:00.000Z"))).toBe(false);
  });
  it("handles 0-minute reminders", () => {
    // The reminder moment equals the start, so it is never due while the appointment is still ahead.
    expect(isReminderDue(appt, 0, at("2026-01-01T09:59:59.000Z"))).toBe(false);
    expect(isReminderDue(appt, 0, at(appt))).toBe(false);
  });
});

const ctx = (over: Partial<SmsContext> = {}): SmsContext => ({
  customerPhone: "+447000000000",
  customerName: "Ann",
  salonName: "Salon",
  appointmentTime: appt,
  ...over,
});

function fakeRepo(queue: number[], contexts: Record<number, SmsContext | null>) {
  const pending = [...queue];
  const release = vi.fn(async (_ids: number[]) => {});
  const repo: ReminderRepo = {
    claimDue: vi.fn(async () => pending.splice(0)),
    release,
    loadContext: vi.fn(async (id: number) => contexts[id] ?? null),
  };
  return { repo, release };
}

describe("runReminderSweep", () => {
  it("sends once per claimed row and a second sweep sends nothing", async () => {
    const { repo } = fakeRepo([1, 2], { 1: ctx(), 2: ctx({ customerPhone: "+447111111111" }) });
    const send = vi.fn(async () => "sent" as const);
    expect(await runReminderSweep(repo, send)).toEqual({ claimed: 2, sent: 2, skipped: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(await runReminderSweep(repo, send)).toEqual({ claimed: 0, sent: 0, skipped: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("releases on failed so the next sweep retries", async () => {
    const { repo, release } = fakeRepo([1], { 1: ctx() });
    const result = await runReminderSweep(repo, async () => "failed");
    expect(result).toMatchObject({ claimed: 1, failed: 1, sent: 0 });
    expect(release).toHaveBeenCalledWith([1]);
  });

  it("releases and counts failed when the sender throws", async () => {
    const { repo, release } = fakeRepo([1], { 1: ctx() });
    const result = await runReminderSweep(repo, async () => {
      throw new Error("boom");
    });
    expect(result.failed).toBe(1);
    expect(release).toHaveBeenCalledWith([1]);
  });

  it("does not release on skipped or missing phone", async () => {
    const { repo, release } = fakeRepo([1, 2], { 1: ctx(), 2: ctx({ customerPhone: "" }) });
    const send = vi.fn(async () => "skipped" as const);
    const result = await runReminderSweep(repo, send);
    expect(result).toEqual({ claimed: 2, sent: 0, skipped: 2, failed: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(release).not.toHaveBeenCalled();
  });

  it("keeps going after one row fails", async () => {
    const { repo } = fakeRepo([1, 2], { 1: ctx(), 2: ctx() });
    const send = vi.fn().mockResolvedValueOnce("failed").mockResolvedValueOnce("sent");
    expect(await runReminderSweep(repo, send)).toMatchObject({ sent: 1, failed: 1 });
  });
});
