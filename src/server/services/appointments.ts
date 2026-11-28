import "server-only";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";

import {
  utcDayRange,
  type AppointmentCreateInput,
  type AppointmentListQuery,
  type AppointmentPatchInput,
} from "@/lib/validation/appointment";
import { getDb } from "@/server/db/client";
import {
  appointmentAppointment,
  customerCustomer,
  customerCustomerSalons,
  salonSalon,
} from "@/server/db/schema";
import { ApiError, notFound } from "@/server/http/errors";
import type { UserDto } from "@/server/services/users";
import type { BookingData } from "@/types/appointment";

export type AppointmentDto = Omit<BookingData, "end_time"> & { end_time: string | null };
export type AppointmentRow = typeof appointmentAppointment.$inferSelect;

type Actor = Pick<UserDto, "id" | "salons">;

export type DeletedAppointmentSnapshot = {
  dto: AppointmentDto;
  customerPhone: string;
  customerName: string;
  salonName: string;
};

export type SmsContext = {
  customerPhone: string;
  customerName: string;
  salonName: string;
  appointmentTime: string;
};

const toIso = (value: string): string => new Date(value).toISOString();
const invalidPk = (id: number) => `Invalid pk "${id}" - object does not exist.`;

export function toAppointmentDto(row: AppointmentRow): AppointmentDto {
  return {
    id: row.id,
    created: toIso(row.created),
    modified: toIso(row.modified),
    appointment_time: toIso(row.appointmentTime),
    end_time: row.endTime ? toIso(row.endTime) : null,
    comment: row.comment,
    column_id: row.columnId,
    salon: row.salonId,
    user: row.userId,
    customer: row.customerId,
  };
}

async function assertCustomerInSalon(customerId: number, salonId: number): Promise<void> {
  const [link] = await getDb()
    .select({ id: customerCustomerSalons.id })
    .from(customerCustomerSalons)
    .where(
      and(
        eq(customerCustomerSalons.customerId, customerId),
        eq(customerCustomerSalons.salonId, salonId)
      )
    )
    .limit(1);
  if (!link) throw new ApiError(400, { customer: [invalidPk(customerId)] });
}

function assertSalonOwned(user: Actor, salonId: number): void {
  if (!user.salons.includes(salonId)) {
    throw new ApiError(400, { salon: [invalidPk(salonId)] });
  }
}

export async function listAppointments(
  user: Actor,
  query: AppointmentListQuery
): Promise<AppointmentDto[]> {
  if (user.salons.length === 0) return [];
  const conditions = [inArray(appointmentAppointment.salonId, user.salons)];
  if (query.date) {
    const [start, end] = utcDayRange(query.date);
    conditions.push(gte(appointmentAppointment.appointmentTime, start));
    conditions.push(lt(appointmentAppointment.appointmentTime, end));
  }
  const rows = await getDb()
    .select()
    .from(appointmentAppointment)
    .where(and(...conditions))
    .orderBy(asc(appointmentAppointment.appointmentTime), asc(appointmentAppointment.id));
  return rows.map(toAppointmentDto);
}

async function findScopedRow(user: Actor, id: number): Promise<AppointmentRow> {
  if (user.salons.length === 0) throw notFound();
  const [row] = await getDb()
    .select()
    .from(appointmentAppointment)
    .where(
      and(
        eq(appointmentAppointment.id, id),
        inArray(appointmentAppointment.salonId, user.salons)
      )
    )
    .limit(1);
  if (!row) throw notFound();
  return row;
}

export async function getAppointment(user: Actor, id: number): Promise<AppointmentDto> {
  return toAppointmentDto(await findScopedRow(user, id));
}

export async function createAppointment(
  user: Actor,
  input: AppointmentCreateInput
): Promise<AppointmentDto> {
  assertSalonOwned(user, input.salon);
  await assertCustomerInSalon(input.customer, input.salon);
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appointmentAppointment)
    .values({
      salonId: input.salon,
      customerId: input.customer,
      userId: user.id,
      appointmentTime: input.appointment_time,
      endTime: input.end_time ?? null,
      comment: input.comment,
      columnId: input.column_id,
      created: now,
      modified: now,
    })
    .returning();
  return toAppointmentDto(row);
}

export async function updateAppointment(
  user: Actor,
  id: number,
  patch: AppointmentPatchInput
): Promise<{ dto: AppointmentDto; timeChanged: boolean }> {
  const existing = await findScopedRow(user, id);

  if (patch.salon !== undefined) assertSalonOwned(user, patch.salon);
  if (patch.salon !== undefined || patch.customer !== undefined) {
    await assertCustomerInSalon(
      patch.customer ?? existing.customerId,
      patch.salon ?? existing.salonId
    );
  }

  const set: Partial<typeof appointmentAppointment.$inferInsert> = {
    modified: new Date().toISOString(),
  };
  if (patch.salon !== undefined) set.salonId = patch.salon;
  if (patch.customer !== undefined) set.customerId = patch.customer;
  if (patch.appointment_time !== undefined) {
    set.appointmentTime = patch.appointment_time;
    // A moved appointment needs a fresh reminder: let the sweep recompute it.
    if (new Date(patch.appointment_time).getTime() !== new Date(existing.appointmentTime).getTime()) {
      set.reminderSentAt = null;
    }
  }
  if (patch.end_time !== undefined) set.endTime = patch.end_time;
  if (patch.comment !== undefined) set.comment = patch.comment;
  if (patch.column_id !== undefined) set.columnId = patch.column_id;

  const [row] = await getDb()
    .update(appointmentAppointment)
    .set(set)
    .where(eq(appointmentAppointment.id, id))
    .returning();
  if (!row) throw notFound();

  const timeChanged =
    patch.appointment_time !== undefined &&
    new Date(patch.appointment_time).getTime() !== new Date(existing.appointmentTime).getTime();
  return { dto: toAppointmentDto(row), timeChanged };
}

export async function deleteAppointment(
  user: Actor,
  id: number
): Promise<DeletedAppointmentSnapshot> {
  const row = await findScopedRow(user, id);
  const ctx = await loadSmsContext(id);
  await getDb().delete(appointmentAppointment).where(eq(appointmentAppointment.id, id));
  return {
    dto: toAppointmentDto(row),
    customerPhone: ctx?.customerPhone ?? "",
    customerName: ctx?.customerName ?? "",
    salonName: ctx?.salonName ?? "",
  };
}

export async function markConfirmationSent(id: number): Promise<void> {
  await getDb()
    .update(appointmentAppointment)
    .set({ confirmationSentAt: new Date().toISOString() })
    .where(eq(appointmentAppointment.id, id));
}

/** Not tenancy-scoped: only called with ids the caller already resolved. */
export async function loadSmsContext(appointmentId: number): Promise<SmsContext | null> {
  const [row] = await getDb()
    .select({
      appointmentTime: appointmentAppointment.appointmentTime,
      customerPhone: customerCustomer.phoneNumber,
      customerName: customerCustomer.fullName,
      salonName: salonSalon.name,
    })
    .from(appointmentAppointment)
    .innerJoin(customerCustomer, eq(customerCustomer.id, appointmentAppointment.customerId))
    .innerJoin(salonSalon, eq(salonSalon.id, appointmentAppointment.salonId))
    .where(eq(appointmentAppointment.id, appointmentId))
    .limit(1);
  if (!row) return null;
  return { ...row, appointmentTime: toIso(row.appointmentTime) };
}
