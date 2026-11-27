import { describe, expect, it } from "vitest";

import {
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentPatchSchema,
  isInPast,
  utcDayRange,
} from "./appointment";

const base = { salon: 1, customer: 2, appointment_time: "2099-01-01T10:00:00Z" };

describe("isInPast", () => {
  it("compares against an injected now", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(isInPast("2025-12-31T23:59:59Z", now)).toBe(true);
    expect(isInPast("2026-01-01T00:00:01Z", now)).toBe(false);
  });
});

describe("appointmentCreateSchema", () => {
  it("applies defaults and ignores nothing else", () => {
    const out = appointmentCreateSchema.parse({ ...base, user: 9 });
    expect(out.comment).toBe("");
    expect(out.column_id).toBe(1);
    expect(out.end_time).toBeUndefined();
  });
  it("rejects past times with the legacy message", () => {
    const r = appointmentCreateSchema.safeParse({ ...base, appointment_time: "2000-01-01T10:00:00Z" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("The appointment time cannot be in the past.");
  });
  it("rejects non-ISO times and bad column bounds", () => {
    expect(appointmentCreateSchema.safeParse({ ...base, appointment_time: "tomorrow" }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, column_id: 0 }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, column_id: 6 }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, column_id: 5 }).success).toBe(true);
  });
  it("accepts null end_time", () => {
    expect(appointmentCreateSchema.parse({ ...base, end_time: null }).end_time).toBeNull();
  });
});

describe("appointmentPatchSchema", () => {
  it("is partial and strict", () => {
    expect(appointmentPatchSchema.parse({ comment: "hi" })).toEqual({ comment: "hi" });
    expect(appointmentPatchSchema.safeParse({ nope: 1 }).success).toBe(false);
  });
  it("applies the same rules when fields are present", () => {
    expect(appointmentPatchSchema.safeParse({ appointment_time: "2000-01-01T10:00:00Z" }).success).toBe(false);
    expect(appointmentPatchSchema.safeParse({ column_id: 7 }).success).toBe(false);
  });
});

describe("appointmentListQuerySchema", () => {
  it("accepts a valid date, empty and absent", () => {
    expect(appointmentListQuerySchema.parse({ date: "2026-12-01" })).toEqual({ date: "2026-12-01" });
    expect(appointmentListQuerySchema.parse({}).date).toBeUndefined();
    expect(appointmentListQuerySchema.parse({ date: "" }).date).toBeUndefined();
  });
  it("rejects malformed and impossible dates", () => {
    for (const date of ["garbage", "2026-13-01", "2026-02-30", "2026-1-1"]) {
      const r = appointmentListQuerySchema.safeParse({ date });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toBe("Enter a valid date.");
    }
  });
});

describe("utcDayRange", () => {
  it("returns a half-open UTC day", () => {
    expect(utcDayRange("2026-12-01")).toEqual(["2026-12-01T00:00:00.000Z", "2026-12-02T00:00:00.000Z"]);
  });
  it("rolls over the year", () => {
    expect(utcDayRange("2026-12-31")).toEqual(["2026-12-31T00:00:00.000Z", "2027-01-01T00:00:00.000Z"]);
  });
});
