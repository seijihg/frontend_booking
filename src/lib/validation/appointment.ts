import { z } from "zod";

export const PAST_ERROR = "The appointment time cannot be in the past.";
export const DATE_ERROR = "Enter a valid date.";

export function isInPast(iso: string, now: number = Date.now()): boolean {
  return new Date(iso).getTime() < now;
}

const isoDateTime = z.string().datetime({ offset: true });
const futureDateTime = isoDateTime.refine((v) => !isInPast(v), PAST_ERROR);
const idSchema = z.number().int().positive();
const columnSchema = z.number().int().min(1).max(5);

export const appointmentCreateSchema = z.object({
  salon: idSchema,
  customer: idSchema,
  user: idSchema.optional(), // ignored: the caller is always the author
  appointment_time: futureDateTime,
  end_time: isoDateTime.nullable().optional(),
  comment: z.string().default(""),
  column_id: columnSchema.default(1),
});

export const appointmentPatchSchema = z
  .object({
    salon: idSchema.optional(),
    customer: idSchema.optional(),
    user: idSchema.optional(),
    appointment_time: futureDateTime.optional(),
    end_time: isoDateTime.nullable().optional(),
    comment: z.string().optional(),
    column_id: columnSchema.optional(),
  })
  .strict();

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export const appointmentListQuerySchema = z.object({
  date: z
    .string()
    .refine(isValidDate, DATE_ERROR)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/** Half-open UTC range `[start, end)` covering the calendar day `YYYY-MM-DD`. */
export function utcDayRange(date: string): [string, string] {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return [start.toISOString(), end.toISOString()];
}

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentPatchInput = z.infer<typeof appointmentPatchSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
