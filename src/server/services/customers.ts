import "server-only";
import { and, asc, desc, eq, inArray, notInArray } from "drizzle-orm";

import type {
  CustomerCreateInput,
  CustomerListQuery,
  CustomerPatchInput,
} from "@/lib/validation/customer";
import { getDb } from "@/server/db/client";
import {
  appointmentAppointment,
  customerCustomer,
  customerCustomerSalons,
} from "@/server/db/schema";
import { notFound } from "@/server/http/errors";
import {
  assertSalonsOwned,
  getSalonDtosByIds,
  type SalonDto,
} from "@/server/services/salons";
import type { UserDto } from "@/server/services/users";
import type { Customer } from "@/types/customer";

export type CustomerDto = Customer;
export type CustomerRow = typeof customerCustomer.$inferSelect;

type Actor = Pick<UserDto, "id" | "salons" | "is_owner">;

const toIso = (value: string): string => new Date(value).toISOString();

export function toCustomerDto(row: CustomerRow, salons: SalonDto[]): CustomerDto {
  return {
    id: row.id,
    full_name: row.fullName,
    phone_number: row.phoneNumber,
    salons,
    created: toIso(row.created),
    modified: toIso(row.modified),
  };
}

/** Keeps only linked salon ids the caller may see (design 02 section 5.2), sorted ascending. */
export function scopeSalonIds(linked: number[], allowed: number[]): number[] {
  const ok = new Set(allowed);
  return linked.filter((id) => ok.has(id)).sort((a, b) => a - b);
}

/** Builds DTOs for rows with one batched salon lookup; nested salons are limited to the caller's. */
async function buildDtos(rows: CustomerRow[], user: Actor): Promise<CustomerDto[]> {
  if (rows.length === 0) return [];
  const links = await getDb()
    .select()
    .from(customerCustomerSalons)
    .where(
      inArray(
        customerCustomerSalons.customerId,
        rows.map((r) => r.id)
      )
    );
  const visible = links.filter((l) => user.salons.includes(l.salonId));
  const salons = await getSalonDtosByIds(visible.map((l) => l.salonId));
  const salonById = new Map(salons.map((s) => [s.id, s]));

  const idsByCustomer = new Map<number, number[]>();
  for (const link of links) {
    const list = idsByCustomer.get(link.customerId) ?? [];
    list.push(link.salonId);
    idsByCustomer.set(link.customerId, list);
  }
  return rows.map((row) => {
    const nested = scopeSalonIds(idsByCustomer.get(row.id) ?? [], user.salons)
      .flatMap((sid) => salonById.get(sid) ?? []);
    return toCustomerDto(row, nested);
  });
}

const SORT_COLUMNS = {
  id: customerCustomer.id,
  full_name: customerCustomer.fullName,
  phone_number: customerCustomer.phoneNumber,
  created: customerCustomer.created,
  modified: customerCustomer.modified,
} as const;

/** Customer ids sharing at least one salon with the caller (optionally narrowed to one salon). */
function visibleCustomerIds(scope: number[]) {
  return getDb()
    .select({ id: customerCustomerSalons.customerId })
    .from(customerCustomerSalons)
    .where(inArray(customerCustomerSalons.salonId, scope));
}

export async function listCustomers(
  user: Actor,
  query: CustomerListQuery
): Promise<CustomerDto[]> {
  const scope =
    query.salon === undefined
      ? user.salons
      : user.salons.filter((id) => id === query.salon);
  if (scope.length === 0) return [];

  const column = SORT_COLUMNS[query.sort_by];
  const direction = query.order === "asc" ? asc : desc;
  const rows = await getDb()
    .select()
    .from(customerCustomer)
    .where(inArray(customerCustomer.id, visibleCustomerIds(scope)))
    .orderBy(direction(column), asc(customerCustomer.id));
  return buildDtos(rows, user);
}

async function findVisibleRow(user: Actor, id: number): Promise<CustomerRow> {
  if (user.salons.length === 0) throw notFound();
  const [row] = await getDb()
    .select()
    .from(customerCustomer)
    .where(
      and(
        eq(customerCustomer.id, id),
        inArray(customerCustomer.id, visibleCustomerIds(user.salons))
      )
    )
    .limit(1);
  if (!row) throw notFound();
  return row;
}

export async function getCustomer(user: Actor, id: number): Promise<CustomerDto> {
  const row = await findVisibleRow(user, id);
  const [dto] = await buildDtos([row], user);
  return dto;
}

export async function createCustomer(
  user: Actor,
  input: CustomerCreateInput
): Promise<CustomerDto> {
  assertSalonsOwned(user, input.salon_ids);
  const now = new Date().toISOString();
  const row = await getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(customerCustomer)
      .values({
        fullName: input.full_name,
        phoneNumber: input.phone_number,
        created: now,
        modified: now,
      })
      .returning();
    await tx.insert(customerCustomerSalons).values(
      Array.from(new Set(input.salon_ids)).map((salonId) => ({
        customerId: created.id,
        salonId,
      }))
    );
    return created;
  });
  const [dto] = await buildDtos([row], user);
  return dto;
}

export async function updateCustomer(
  user: Actor,
  id: number,
  patch: CustomerPatchInput
): Promise<CustomerDto> {
  await findVisibleRow(user, id);
  if (patch.salon_ids !== undefined) assertSalonsOwned(user, patch.salon_ids);

  const row = await getDb().transaction(async (tx) => {
    const set: Partial<typeof customerCustomer.$inferInsert> = {
      modified: new Date().toISOString(),
    };
    if (patch.full_name !== undefined) set.fullName = patch.full_name;
    if (patch.phone_number !== undefined) set.phoneNumber = patch.phone_number;
    const [updated] = await tx
      .update(customerCustomer)
      .set(set)
      .where(eq(customerCustomer.id, id))
      .returning();
    if (!updated) throw notFound();

    if (patch.salon_ids !== undefined) {
      // Replace the set within the caller's salons; links to salons the caller
      // cannot see belong to other tenants and are left untouched.
      const wanted = Array.from(new Set(patch.salon_ids));
      await tx
        .delete(customerCustomerSalons)
        .where(
          and(
            eq(customerCustomerSalons.customerId, id),
            inArray(customerCustomerSalons.salonId, user.salons),
            notInArray(customerCustomerSalons.salonId, wanted)
          )
        );
      const current = await tx
        .select({ salonId: customerCustomerSalons.salonId })
        .from(customerCustomerSalons)
        .where(eq(customerCustomerSalons.customerId, id));
      const have = new Set(current.map((c) => c.salonId));
      const missing = wanted.filter((sid) => !have.has(sid));
      if (missing.length > 0) {
        await tx
          .insert(customerCustomerSalons)
          .values(missing.map((salonId) => ({ customerId: id, salonId })));
      }
    }
    return updated;
  });
  const [dto] = await buildDtos([row], user);
  return dto;
}

export async function deleteCustomer(user: Actor, id: number): Promise<void> {
  await findVisibleRow(user, id);
  await getDb().transaction(async (tx) => {
    await tx.delete(appointmentAppointment).where(eq(appointmentAppointment.customerId, id));
    await tx.delete(customerCustomerSalons).where(eq(customerCustomerSalons.customerId, id));
    await tx.delete(customerCustomer).where(eq(customerCustomer.id, id));
  });
}
