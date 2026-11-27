import "server-only";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { utcDayRange } from "@/lib/validation/appointment";
import { normalizePhoneNumber } from "@/lib/validation/phone";
import type { UserDto } from "@/server/services/users";
import { isToolName, parseToolArgs, type ToolArgs } from "./tools";

dayjs.extend(utc);

export type VoiceCustomer = { id: number; fullName: string; phoneNumber: string };

export interface VoiceRepo {
  findCustomerByPhone(salonId: number, phone: string): Promise<VoiceCustomer | null>;
  findCustomerById(salonId: number, customerId: number): Promise<VoiceCustomer | null>;
  createCustomer(input: {
    fullName: string;
    phone: string;
    salonId: number;
  }): Promise<VoiceCustomer>;
  listAppointmentsOnDay(
    salonId: number,
    columnId: number,
    dayStartIso: string,
    dayEndIso: string
  ): Promise<{ appointmentTime: string; endTime: string | null }[]>;
  createAppointment(input: {
    salonId: number;
    customerId: number;
    appointmentTime: string;
    endTime: string;
    columnId: number;
    comment: string;
  }): Promise<{ id: number }>;
}

export type VoiceContext = { salonId: number; user: UserDto };

const MINUTE = 60_000;
const ALL_COLUMNS = [1, 2, 3, 4, 5];

const fail = (error: string): string => JSON.stringify({ error });

/** Normalises when possible, otherwise keeps the raw string (so lookups simply miss). */
const phoneOf = (raw: string): string => normalizePhoneNumber(raw) ?? raw;

/** Always returns a JSON string, so the model can read the result. */
export async function executeToolCall(
  name: string,
  args: unknown,
  ctx: VoiceContext,
  repo: VoiceRepo
): Promise<string> {
  if (!isToolName(name)) return fail(`Unknown tool: ${name}`);
  try {
    switch (name) {
      case "lookup_customer":
        return await lookupCustomer(parseToolArgs(name, args), ctx, repo);
      case "create_customer":
        return await createCustomer(parseToolArgs(name, args), ctx, repo);
      case "check_availability":
        return await checkAvailability(parseToolArgs(name, args), ctx, repo);
      case "create_appointment":
        return await createAppointment(parseToolArgs(name, args), ctx, repo);
    }
  } catch (err) {
    console.error(`Tool ${name} failed`, err);
    return fail(`Tool '${name}' failed unexpectedly.`);
  }
}

async function lookupCustomer(
  args: ToolArgs["lookup_customer"],
  ctx: VoiceContext,
  repo: VoiceRepo
): Promise<string> {
  const phone = phoneOf(args.phone_number);
  const customer = await repo.findCustomerByPhone(ctx.salonId, phone);
  if (customer) {
    return JSON.stringify({
      found: true,
      customer_id: customer.id,
      full_name: customer.fullName,
      phone_number: customer.phoneNumber,
    });
  }
  return JSON.stringify({
    found: false,
    message: `No customer found with phone number ${args.phone_number} in this salon.`,
  });
}

async function createCustomer(
  args: ToolArgs["create_customer"],
  ctx: VoiceContext,
  repo: VoiceRepo
): Promise<string> {
  const phone = normalizePhoneNumber(args.phone_number);
  if (phone === null) return fail("Invalid phone number.");

  const existing = await repo.findCustomerByPhone(ctx.salonId, phone);
  if (existing) {
    return JSON.stringify({
      created: false,
      customer_id: existing.id,
      full_name: existing.fullName,
      phone_number: existing.phoneNumber,
      message: "Customer already exists.",
    });
  }
  const customer = await repo.createCustomer({
    fullName: args.full_name,
    phone,
    salonId: ctx.salonId,
  });
  return JSON.stringify({
    created: true,
    customer_id: customer.id,
    full_name: customer.fullName,
    phone_number: customer.phoneNumber,
  });
}

/** Parses `YYYY-MM-DD HH:mm` as a UTC wall-clock instant (Django TIME_ZONE is UTC). */
function parseUtcDateTime(date: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2})$/.exec(`${date} ${time}`);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const out = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const valid =
    out.getUTCFullYear() === y &&
    out.getUTCMonth() === mo - 1 &&
    out.getUTCDate() === d &&
    out.getUTCHours() === h &&
    out.getUTCMinutes() === mi;
  return valid ? out : null;
}

const hhmm = (ms: number): string => dayjs.utc(ms).format("HH:mm");
const floorToMinute = (ms: number): number => Math.floor(ms / MINUTE) * MINUTE;

async function checkAvailability(
  args: ToolArgs["check_availability"],
  ctx: VoiceContext,
  repo: VoiceRepo
): Promise<string> {
  const { date, time, duration_minutes: duration, column_id: columnId } = args;
  if (duration % 15 !== 0) return fail("Duration must be a multiple of 15 minutes.");

  const start = parseUtcDateTime(date, time);
  if (!start) return fail(`Invalid date/time format: ${date} ${time}`);

  const startMs = start.getTime();
  const endMs = startMs + duration * MINUTE;
  const [dayStart, dayEnd] = utcDayRange(start.toISOString().slice(0, 10));
  const columns = columnId ? [columnId] : ALL_COLUMNS;

  const availableColumns: number[] = [];
  const busyColumns: Record<string, string[]> = {};

  for (const col of columns) {
    const appointments = await repo.listAppointmentsOnDay(ctx.salonId, col, dayStart, dayEnd);
    const conflicts: string[] = [];
    for (const appt of appointments) {
      const rawStart = new Date(appt.appointmentTime).getTime();
      const apptStart = floorToMinute(rawStart);
      const apptEnd = floorToMinute(
        appt.endTime ? new Date(appt.endTime).getTime() : rawStart + 60 * MINUTE
      );
      // Overlap: existing.start < requested.end AND existing.end > requested.start
      if (apptStart < endMs && apptEnd > startMs) {
        conflicts.push(`${hhmm(apptStart)}-${hhmm(apptEnd)}`);
      }
    }
    if (conflicts.length > 0) busyColumns[String(col)] = conflicts;
    else availableColumns.push(col);
  }

  return JSON.stringify({ available_columns: availableColumns, busy_columns: busyColumns });
}

const ISO_RE =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

/** ISO 8601 parse; input without an offset is treated as UTC. */
function parseIsoInstant(value: string): Date | null {
  const m = ISO_RE.exec(value);
  if (!m) return null;
  let text = value.replace(" ", "T");
  if (!m[1] && text.includes("T")) text += "Z";
  const out = new Date(text);
  return Number.isNaN(out.getTime()) ? null : out;
}

async function createAppointment(
  args: ToolArgs["create_appointment"],
  ctx: VoiceContext,
  repo: VoiceRepo
): Promise<string> {
  const { customer_id: customerId, appointment_time: timeStr, duration_minutes: duration } = args;
  const columnId = args.column_id;

  if (!columnId || columnId < 1 || columnId > 5) {
    return fail("column_id must be between 1 and 5.");
  }
  if (duration % 15 !== 0) return fail("Duration must be a multiple of 15 minutes.");

  const start = parseIsoInstant(timeStr);
  if (!start) return fail(`Invalid appointment_time format: ${timeStr}`);
  if (start.getTime() < Date.now()) return fail("Cannot book appointments in the past.");

  const customer =
    customerId === undefined ? null : await repo.findCustomerById(ctx.salonId, customerId);
  if (!customer) return fail(`Customer ${customerId ?? "None"} not found in this salon.`);

  const phone = args.phone_number ? phoneOf(args.phone_number) : "";
  if (phone && customer.phoneNumber !== phone) {
    return fail(
      `Phone number mismatch: customer ${customerId} has ${customer.phoneNumber}, not ${phone}. Use the correct customer_id.`
    );
  }

  const end = new Date(start.getTime() + duration * MINUTE);
  const appointment = await repo.createAppointment({
    salonId: ctx.salonId,
    customerId: customer.id,
    appointmentTime: start.toISOString(),
    endTime: end.toISOString(),
    columnId,
    comment: args.comment,
  });

  return JSON.stringify({
    created: true,
    appointment_id: appointment.id,
    message: `Appointment booked for ${customer.fullName} on ${dayjs.utc(start).format("YYYY-MM-DD [at] HH:mm")} (column ${columnId}, ${duration} minutes).`,
  });
}
