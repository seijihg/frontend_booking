import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDto } from "@/server/services/users";
import {
  executeToolCall,
  type VoiceContext,
  type VoiceCustomer,
  type VoiceRepo,
} from "./executor";

const SALON = 1;
const OTHER_SALON = 2;
const HOUR = 3_600_000;
const MIN = 60_000;

type StoredAppointment = {
  id: number;
  salonId: number;
  customerId: number;
  appointmentTime: string;
  endTime: string | null;
  columnId: number;
  comment: string;
};

function makeRepo() {
  const customers: (VoiceCustomer & { salonIds: number[] })[] = [
    { id: 1, fullName: "Ellie Smith", phoneNumber: "+447700900123", salonIds: [SALON] },
    { id: 2, fullName: "Other Person", phoneNumber: "+447700900555", salonIds: [OTHER_SALON] },
  ];
  const appointments: StoredAppointment[] = [];
  let nextCustomerId = 10;
  let nextAppointmentId = 100;
  const strip = ({ id, fullName, phoneNumber }: VoiceCustomer): VoiceCustomer => ({
    id,
    fullName,
    phoneNumber,
  });

  const repo: VoiceRepo = {
    async findCustomerByPhone(salonId, phone) {
      const c = customers.find((x) => x.salonIds.includes(salonId) && x.phoneNumber === phone);
      return c ? strip(c) : null;
    },
    async findCustomerById(salonId, customerId) {
      const c = customers.find((x) => x.salonIds.includes(salonId) && x.id === customerId);
      return c ? strip(c) : null;
    },
    async createCustomer({ fullName, phone, salonId }) {
      const c = { id: nextCustomerId++, fullName, phoneNumber: phone, salonIds: [salonId] };
      customers.push(c);
      return strip(c);
    },
    async listAppointmentsOnDay(salonId, columnId, dayStartIso, dayEndIso) {
      return appointments
        .filter(
          (a) =>
            a.salonId === salonId &&
            a.columnId === columnId &&
            a.appointmentTime >= dayStartIso &&
            a.appointmentTime < dayEndIso
        )
        .map((a) => ({ appointmentTime: a.appointmentTime, endTime: a.endTime }));
    },
    async createAppointment(input) {
      const a = { id: nextAppointmentId++, ...input };
      appointments.push(a);
      return { id: a.id };
    },
  };
  return { repo, customers, appointments };
}

const ctx: VoiceContext = { salonId: SALON, user: { id: 7, salons: [SALON] } as UserDto };

let fake: ReturnType<typeof makeRepo>;
beforeEach(() => {
  fake = makeRepo();
});

const run = async (name: string, args: unknown) =>
  JSON.parse(await executeToolCall(name, args, ctx, fake.repo)) as Record<string, any>;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const hm = (d: Date) => d.toISOString().slice(11, 16);

/** Tomorrow at 02:00 UTC-ish: now + 1 day + 2 hours, minute-aligned. */
function futureStart(): Date {
  const t = Date.now() + 24 * HOUR + 2 * HOUR;
  return new Date(Math.floor(t / MIN) * MIN);
}

function seedExisting(columnId = 2, endTime: boolean | "null" = true) {
  const start = futureStart();
  const appt: StoredAppointment = {
    id: 1,
    salonId: SALON,
    customerId: 1,
    appointmentTime: start.toISOString(),
    endTime: endTime === "null" ? null : new Date(start.getTime() + HOUR).toISOString(),
    columnId,
    comment: "",
  };
  fake.appointments.push(appt);
  return { start, end: new Date(start.getTime() + HOUR), appt };
}

describe("lookup_customer", () => {
  it("finds an existing customer", async () => {
    const r = await run("lookup_customer", { phone_number: "+447700900123" });
    expect(r).toMatchObject({ found: true, customer_id: 1, full_name: "Ellie Smith" });
  });
  it("normalises UK national numbers", async () => {
    const r = await run("lookup_customer", { phone_number: "07700 900123" });
    expect(r.found).toBe(true);
  });
  it("is not found for an unknown number", async () => {
    expect((await run("lookup_customer", { phone_number: "+447700999999" })).found).toBe(false);
  });
  it("is scoped to the salon", async () => {
    const r = JSON.parse(
      await executeToolCall(
        "lookup_customer",
        { phone_number: "+447700900123" },
        { ...ctx, salonId: OTHER_SALON },
        fake.repo
      )
    );
    expect(r.found).toBe(false);
  });
  it("handles an invalid phone format", async () => {
    expect((await run("lookup_customer", { phone_number: "not-a-phone" })).found).toBe(false);
  });
});

describe("create_customer", () => {
  it("creates a new customer in the salon", async () => {
    const r = await run("create_customer", { full_name: "New Person", phone_number: "+447700900456" });
    expect(r.created).toBe(true);
    const stored = fake.customers.find((c) => c.id === r.customer_id);
    expect(stored?.salonIds).toContain(SALON);
    expect(stored?.phoneNumber).toBe("+447700900456");
  });
  it("returns the existing customer for a duplicate phone", async () => {
    const r = await run("create_customer", { full_name: "Ellie Smith", phone_number: "+447700900123" });
    expect(r).toMatchObject({ created: false, customer_id: 1, message: "Customer already exists." });
  });
  it("normalises the phone before storing", async () => {
    const r = await run("create_customer", { full_name: "Uk Person", phone_number: "07700900789" });
    expect(r.phone_number).toBe("+447700900789");
  });
  it("rejects an unnormalisable phone without inserting", async () => {
    const before = fake.customers.length;
    const r = await run("create_customer", { full_name: "X", phone_number: "abc" });
    expect(r).toEqual({ error: "Invalid phone number." });
    expect(fake.customers).toHaveLength(before);
  });
});

describe("check_availability", () => {
  it("reports all columns free with no appointments", async () => {
    const d = futureStart();
    const r = await run("check_availability", { date: ymd(d), time: "10:00", duration_minutes: 60 });
    expect(r.available_columns).toEqual([1, 2, 3, 4, 5]);
    expect(r.busy_columns).toEqual({});
  });

  it("reports the busy column with the conflicting range", async () => {
    const { start, end } = seedExisting();
    const r = await run("check_availability", { date: ymd(start), time: hm(start), duration_minutes: 60 });
    expect(r.available_columns).not.toContain(2);
    expect(r.available_columns).toContain(1);
    expect(r.busy_columns["2"]).toEqual([`${hm(start)}-${hm(end)}`]);
  });

  it("checks a specific free column", async () => {
    const d = futureStart();
    const r = await run("check_availability", { date: ymd(d), time: "10:00", column_id: 3 });
    expect(r.available_columns).toEqual([3]);
  });

  it("checks a specific busy column", async () => {
    const { start } = seedExisting();
    const r = await run("check_availability", { date: ymd(start), time: hm(start), column_id: 2 });
    expect(r.available_columns).toEqual([]);
  });

  it("detects a request starting inside an existing appointment", async () => {
    const { start } = seedExisting();
    const q = new Date(start.getTime() + 30 * MIN);
    const r = await run("check_availability", {
      date: ymd(q), time: hm(q), duration_minutes: 30, column_id: 2,
    });
    expect(r.available_columns).not.toContain(2);
  });

  it("detects a request ending inside an existing appointment", async () => {
    const { start } = seedExisting();
    const q = new Date(start.getTime() - 30 * MIN);
    const r = await run("check_availability", {
      date: ymd(q), time: hm(q), duration_minutes: 60, column_id: 2,
    });
    expect(r.available_columns).not.toContain(2);
  });

  it("treats an adjacent request as free", async () => {
    const { end } = seedExisting();
    const r = await run("check_availability", {
      date: ymd(end), time: hm(end), duration_minutes: 60, column_id: 2,
    });
    expect(r.available_columns).toContain(2);
  });

  it("assumes 60 minutes when end_time is null", async () => {
    const { start } = seedExisting(1, "null");
    const q = new Date(start.getTime() + 30 * MIN);
    const r = await run("check_availability", {
      date: ymd(q), time: hm(q), duration_minutes: 30, column_id: 1,
    });
    expect(r.available_columns).not.toContain(1);
  });

  it("rejects a duration that is not a multiple of 15", async () => {
    const r = await run("check_availability", { date: ymd(futureStart()), time: "10:00", duration_minutes: 25 });
    expect(r).toEqual({ error: "Duration must be a multiple of 15 minutes." });
  });

  it("rejects an invalid date", async () => {
    const r = await run("check_availability", { date: "tomorrow", time: "10:00" });
    expect(r).toEqual({ error: "Invalid date/time format: tomorrow 10:00" });
  });

  it("defaults the duration to 60 minutes", async () => {
    const { start } = seedExisting();
    const r = await run("check_availability", { date: ymd(start), time: hm(start) });
    expect(r.available_columns).not.toContain(2);
  });

  it("uses the UTC calendar day for candidate appointments", async () => {
    fake.appointments.push({
      id: 5, salonId: SALON, customerId: 1, columnId: 4, comment: "",
      appointmentTime: "2030-01-01T23:30:00.000Z", endTime: "2030-01-02T00:30:00.000Z",
    });
    const r = await run("check_availability", { date: "2030-01-01", time: "23:45", column_id: 4 });
    expect(r.busy_columns["4"]).toEqual(["23:30-00:30"]);
  });
});

describe("create_appointment", () => {
  const base = () => ({
    customer_id: 1,
    phone_number: "+447700900123",
    appointment_time: new Date(Date.now() + 24 * HOUR).toISOString(),
    column_id: 3,
  });

  it("books with the given duration and comment", async () => {
    const args = { ...base(), duration_minutes: 30, comment: "Haircut" };
    const r = await run("create_appointment", args);
    expect(r.created).toBe(true);
    const stored = fake.appointments.find((a) => a.id === r.appointment_id)!;
    expect(stored).toMatchObject({ columnId: 3, customerId: 1, comment: "Haircut", salonId: SALON });
    expect(new Date(stored.endTime!).getTime() - new Date(stored.appointmentTime).getTime()).toBe(30 * MIN);
  });

  it("formats the confirmation message as UTC wall-clock", async () => {
    const r = await run("create_appointment", {
      ...base(), appointment_time: "2099-03-15T14:30:00Z", duration_minutes: 45,
    });
    expect(r.message).toBe(
      "Appointment booked for Ellie Smith on 2099-03-15 at 14:30 (column 3, 45 minutes)."
    );
  });

  it("defaults the duration to 60 minutes", async () => {
    const r = await run("create_appointment", base());
    const stored = fake.appointments.find((a) => a.id === r.appointment_id)!;
    expect(new Date(stored.endTime!).getTime() - new Date(stored.appointmentTime).getTime()).toBe(60 * MIN);
  });

  it("treats a naive datetime as UTC", async () => {
    const r = await run("create_appointment", { ...base(), appointment_time: "2099-03-15T14:30:00" });
    const stored = fake.appointments.find((a) => a.id === r.appointment_id)!;
    expect(stored.appointmentTime).toBe("2099-03-15T14:30:00.000Z");
  });

  it("rejects past times", async () => {
    const r = await run("create_appointment", {
      ...base(), appointment_time: new Date(Date.now() - HOUR).toISOString(),
    });
    expect(r).toEqual({ error: "Cannot book appointments in the past." });
  });

  it("rejects an invalid column", async () => {
    expect((await run("create_appointment", { ...base(), column_id: 6 })).error).toBe(
      "column_id must be between 1 and 5."
    );
  });

  it("rejects a customer from another salon", async () => {
    const r = await run("create_appointment", { ...base(), customer_id: 2, phone_number: "" });
    expect(r.error).toBe("Customer 2 not found in this salon.");
  });

  it("rejects an invalid duration", async () => {
    const r = await run("create_appointment", { ...base(), duration_minutes: 25 });
    expect(r.error).toBe("Duration must be a multiple of 15 minutes.");
  });

  it("rejects a phone number mismatch and books nothing", async () => {
    const r = await run("create_appointment", { ...base(), phone_number: "+447999999999" });
    expect(r.error.toLowerCase()).toContain("mismatch");
    expect(fake.appointments).toHaveLength(0);
  });

  it("returns error JSON for bad input", async () => {
    const r = await run("create_appointment", {
      customer_id: 999999, appointment_time: "not-a-datetime", column_id: 1,
    });
    expect(r.error).toBe("Invalid appointment_time format: not-a-datetime");
  });
});

describe("dispatcher", () => {
  it("returns an error for an unknown tool", async () => {
    expect(await run("delete_everything", {})).toEqual({ error: "Unknown tool: delete_everything" });
  });

  it("returns a generic error when a handler throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    fake.repo.findCustomerByPhone = async () => {
      throw new Error("db down");
    };
    const r = await run("lookup_customer", { phone_number: "+447700900123" });
    expect(r).toEqual({ error: "Tool 'lookup_customer' failed unexpectedly." });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("tolerates non-object arguments", async () => {
    const r = await run("lookup_customer", "garbage");
    expect(r.found).toBe(false);
  });
});
