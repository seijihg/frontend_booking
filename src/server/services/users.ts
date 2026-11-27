import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import {
  userExtendeduser,
  userExtendeduserAddresses,
  userExtendeduserSalons,
} from "@/server/db/schema";
import type { User } from "@/types/user";

export type UserDto = User;
export type UserRow = typeof userExtendeduser.$inferSelect;

export type UserPatch = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  is_owner?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
};

const toIso = (value: string): string => new Date(value).toISOString();

export function toUserDto(
  row: UserRow,
  salonIds: number[],
  addressIds: number[]
): UserDto {
  return {
    id: row.id,
    phone_number: row.phoneNumber,
    salons: salonIds,
    last_login: row.lastLogin ? toIso(row.lastLogin) : null,
    first_name: row.firstName,
    last_name: row.lastName,
    is_staff: row.isStaff,
    is_active: row.isActive,
    date_joined: toIso(row.dateJoined),
    created: toIso(row.created),
    modified: toIso(row.modified),
    email: row.email,
    is_owner: row.isOwner,
    full_name: row.fullName,
    addresses: addressIds,
  };
}

export async function listUserSalonIds(userId: number): Promise<number[]> {
  const rows = await getDb()
    .select({ salonId: userExtendeduserSalons.salonId })
    .from(userExtendeduserSalons)
    .where(eq(userExtendeduserSalons.extendeduserId, userId))
    .orderBy(userExtendeduserSalons.salonId);
  return rows.map((r) => r.salonId);
}

async function listUserAddressIds(userId: number): Promise<number[]> {
  const rows = await getDb()
    .select({ addressId: userExtendeduserAddresses.addressId })
    .from(userExtendeduserAddresses)
    .where(eq(userExtendeduserAddresses.extendeduserId, userId))
    .orderBy(userExtendeduserAddresses.addressId);
  return rows.map((r) => r.addressId);
}

async function buildDto(row: UserRow): Promise<UserDto> {
  const [salonIds, addressIds] = await Promise.all([
    listUserSalonIds(row.id),
    listUserAddressIds(row.id),
  ]);
  return toUserDto(row, salonIds, addressIds);
}

/** Internal lookup for login: includes the password hash. Email is matched case-insensitively. */
export async function findUserByEmail(
  email: string
): Promise<{ row: UserRow; passwordHash: string } | null> {
  const [row] = await getDb()
    .select()
    .from(userExtendeduser)
    .where(eq(sql`lower(${userExtendeduser.email})`, email.toLowerCase()))
    .limit(1);
  return row ? { row, passwordHash: row.password } : null;
}

export async function getUserDto(id: number): Promise<UserDto | null> {
  const [row] = await getDb()
    .select()
    .from(userExtendeduser)
    .where(eq(userExtendeduser.id, id))
    .limit(1);
  return row ? buildDto(row) : null;
}

export async function updateUser(
  id: number,
  patch: UserPatch
): Promise<UserDto | null> {
  const set: Partial<typeof userExtendeduser.$inferInsert> = {
    modified: new Date().toISOString(),
  };
  if (patch.first_name !== undefined) set.firstName = patch.first_name;
  if (patch.last_name !== undefined) set.lastName = patch.last_name;
  if (patch.full_name !== undefined) set.fullName = patch.full_name;
  if (patch.phone_number !== undefined) set.phoneNumber = patch.phone_number;
  if (patch.is_owner !== undefined) set.isOwner = patch.is_owner;
  if (patch.is_staff !== undefined) set.isStaff = patch.is_staff;
  if (patch.is_active !== undefined) set.isActive = patch.is_active;

  const [row] = await getDb()
    .update(userExtendeduser)
    .set(set)
    .where(eq(userExtendeduser.id, id))
    .returning();
  return row ? buildDto(row) : null;
}

export async function touchLastLogin(id: number): Promise<void> {
  await getDb()
    .update(userExtendeduser)
    .set({ lastLogin: new Date().toISOString() })
    .where(eq(userExtendeduser.id, id));
}

/** Design 02 §5.2: self, or an owner sharing at least one salon with the target. */
export async function canAccessUser(
  session: { user: UserDto },
  targetId: number
): Promise<boolean> {
  const caller = session.user;
  if (caller.id === targetId) return true;
  if (!caller.is_owner || caller.salons.length === 0) return false;
  const [shared] = await getDb()
    .select({ id: userExtendeduserSalons.id })
    .from(userExtendeduserSalons)
    .where(
      and(
        eq(userExtendeduserSalons.extendeduserId, targetId),
        inArray(userExtendeduserSalons.salonId, caller.salons)
      )
    )
    .limit(1);
  return Boolean(shared);
}
