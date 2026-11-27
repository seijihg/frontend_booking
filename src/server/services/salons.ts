import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";

import type {
  AddressInput,
  SalonCreateInput,
  SalonPatchInput,
} from "@/lib/validation/salon";
import { getDb } from "@/server/db/client";
import {
  addressAddress,
  appointmentAppointment,
  customerCustomerSalons,
  salonSalon,
  salonSalonAddresses,
  userExtendeduserAddresses,
  userExtendeduserSalons,
} from "@/server/db/schema";
import { ApiError, forbidden, notFound } from "@/server/http/errors";
import type { UserDto } from "@/server/services/users";
import type { Address, Salon } from "@/types/salon";

export type SalonDto = Salon;
export type SalonRow = typeof salonSalon.$inferSelect;
export type AddressRow = typeof addressAddress.$inferSelect;

type Actor = Pick<UserDto, "id" | "salons" | "is_owner">;
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

const toIso = (value: string): string => new Date(value).toISOString();

export function toAddressDto(row: AddressRow): Address {
  return {
    id: row.id,
    street: row.street,
    city: row.city,
    postal_code: row.postalCode,
    created: toIso(row.created),
    modified: toIso(row.modified),
  };
}

export function toSalonDto(row: SalonRow, addresses: AddressRow[]): SalonDto {
  return {
    id: row.id,
    name: row.name,
    phone_number: row.phoneNumber,
    reminder_time_minutes: row.reminderTimeMinutes,
    addresses: addresses.map(toAddressDto),
    created: toIso(row.created),
    modified: toIso(row.modified),
  };
}

/** Batch-loads salons (with addresses) by id, ordered by id. Not tenancy-scoped: callers scope the ids. */
export async function getSalonDtosByIds(ids: number[]): Promise<SalonDto[]> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return [];
  const db = getDb();
  const salons = await db
    .select()
    .from(salonSalon)
    .where(inArray(salonSalon.id, unique))
    .orderBy(asc(salonSalon.id));
  if (salons.length === 0) return [];

  const links = await db
    .select({ salonId: salonSalonAddresses.salonId, address: addressAddress })
    .from(salonSalonAddresses)
    .innerJoin(addressAddress, eq(addressAddress.id, salonSalonAddresses.addressId))
    .where(inArray(salonSalonAddresses.salonId, unique))
    .orderBy(asc(addressAddress.id));

  const bySalon = new Map<number, AddressRow[]>();
  for (const link of links) {
    const list = bySalon.get(link.salonId) ?? [];
    list.push(link.address);
    bySalon.set(link.salonId, list);
  }
  return salons.map((row) => toSalonDto(row, bySalon.get(row.id) ?? []));
}

/** Throws the DRF-style 400 when any id is outside the caller's salons. */
export function assertSalonsOwned(user: Pick<UserDto, "salons">, ids: number[]): void {
  const allowed = new Set(user.salons);
  const bad = Array.from(new Set(ids)).filter((id) => !allowed.has(id));
  if (bad.length > 0) {
    throw new ApiError(400, {
      salon_ids: bad.map((id) => `Invalid pk "${id}" - object does not exist.`),
    });
  }
}

export async function listSalons(user: Actor): Promise<SalonDto[]> {
  return getSalonDtosByIds(user.salons);
}

export async function getSalon(user: Actor, id: number): Promise<SalonDto> {
  if (!user.salons.includes(id)) throw notFound();
  const [dto] = await getSalonDtosByIds([id]);
  if (!dto) throw notFound();
  return dto;
}

async function insertAddress(tx: Tx, input: AddressInput, now: string): Promise<number> {
  const [row] = await tx
    .insert(addressAddress)
    .values({
      street: input.street,
      city: input.city,
      postalCode: input.postal_code,
      created: now,
      modified: now,
    })
    .returning({ id: addressAddress.id });
  return row.id;
}

/** Deletes addresses no longer owned by a salon, unless a user still references them. */
async function deleteOrphanAddresses(tx: Tx, addressIds: number[]): Promise<void> {
  if (addressIds.length === 0) return;
  const referenced = await tx
    .select({ id: userExtendeduserAddresses.addressId })
    .from(userExtendeduserAddresses)
    .where(inArray(userExtendeduserAddresses.addressId, addressIds));
  const keep = new Set(referenced.map((r) => r.id));
  const removable = addressIds.filter((id) => !keep.has(id));
  if (removable.length > 0) {
    await tx.delete(addressAddress).where(inArray(addressAddress.id, removable));
  }
}

export async function createSalon(user: Actor, input: SalonCreateInput): Promise<SalonDto> {
  if (!user.is_owner) throw forbidden();
  const now = new Date().toISOString();
  const salonId = await getDb().transaction(async (tx) => {
    const [salon] = await tx
      .insert(salonSalon)
      .values({
        name: input.name,
        phoneNumber: input.phone_number,
        reminderTimeMinutes: input.reminder_time_minutes,
        created: now,
        modified: now,
      })
      .returning({ id: salonSalon.id });
    for (const address of input.addresses) {
      const addressId = await insertAddress(tx, address, now);
      await tx.insert(salonSalonAddresses).values({ salonId: salon.id, addressId });
    }
    await tx
      .insert(userExtendeduserSalons)
      .values({ extendeduserId: user.id, salonId: salon.id });
    return salon.id;
  });
  const [dto] = await getSalonDtosByIds([salonId]);
  return dto;
}

export async function updateSalon(
  user: Actor,
  id: number,
  patch: SalonPatchInput
): Promise<SalonDto> {
  if (!user.salons.includes(id)) throw notFound();
  const now = new Date().toISOString();

  await getDb().transaction(async (tx) => {
    const set: Partial<typeof salonSalon.$inferInsert> = { modified: now };
    if (patch.name !== undefined) set.name = patch.name;
    if (patch.phone_number !== undefined) set.phoneNumber = patch.phone_number;
    if (patch.reminder_time_minutes !== undefined) {
      set.reminderTimeMinutes = patch.reminder_time_minutes;
    }
    const updated = await tx
      .update(salonSalon)
      .set(set)
      .where(eq(salonSalon.id, id))
      .returning({ id: salonSalon.id });
    if (updated.length === 0) throw notFound();

    if (patch.addresses === undefined) return;

    const existing = await tx
      .select({ addressId: salonSalonAddresses.addressId })
      .from(salonSalonAddresses)
      .where(eq(salonSalonAddresses.salonId, id));
    const owned = new Set(existing.map((r) => r.addressId));

    const badIds = patch.addresses
      .map((a) => a.id)
      .filter((aid): aid is number => aid !== undefined && !owned.has(aid));
    if (badIds.length > 0) {
      throw new ApiError(400, {
        addresses: badIds.map((aid) => `Invalid pk "${aid}" - object does not exist.`),
      });
    }

    const finalIds: number[] = [];
    for (const address of patch.addresses) {
      if (address.id !== undefined) {
        await tx
          .update(addressAddress)
          .set({
            street: address.street,
            city: address.city,
            postalCode: address.postal_code,
            modified: now,
          })
          .where(eq(addressAddress.id, address.id));
        finalIds.push(address.id);
      } else {
        const newId = await insertAddress(tx, address, now);
        await tx.insert(salonSalonAddresses).values({ salonId: id, addressId: newId });
        finalIds.push(newId);
      }
    }

    const final = new Set(finalIds);
    const removed = Array.from(owned).filter((aid) => !final.has(aid));
    if (removed.length > 0) {
      await tx
        .delete(salonSalonAddresses)
        .where(
          and(
            eq(salonSalonAddresses.salonId, id),
            inArray(salonSalonAddresses.addressId, removed)
          )
        );
      await deleteOrphanAddresses(tx, removed);
    }
  });

  const [dto] = await getSalonDtosByIds([id]);
  if (!dto) throw notFound();
  return dto;
}

export async function deleteSalon(user: Actor, id: number): Promise<void> {
  if (!user.is_owner) throw forbidden();
  if (!user.salons.includes(id)) throw notFound();

  await getDb().transaction(async (tx) => {
    const links = await tx
      .select({ addressId: salonSalonAddresses.addressId })
      .from(salonSalonAddresses)
      .where(eq(salonSalonAddresses.salonId, id));
    const addressIds = links.map((l) => l.addressId);

    await tx.delete(appointmentAppointment).where(eq(appointmentAppointment.salonId, id));
    await tx.delete(customerCustomerSalons).where(eq(customerCustomerSalons.salonId, id));
    await tx.delete(salonSalonAddresses).where(eq(salonSalonAddresses.salonId, id));
    await deleteOrphanAddresses(tx, addressIds);
    await tx.delete(userExtendeduserSalons).where(eq(userExtendeduserSalons.salonId, id));
    await tx.delete(salonSalon).where(eq(salonSalon.id, id));
  });
}
