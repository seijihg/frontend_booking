// Seeds the default salon, address and owner user (port of the Django
// `seed_data` management command). Idempotent: existing rows are reused.
// Run with `yarn db:seed`; the `react-server` condition lets the `server-only`
// guard in src/server resolve to its empty module outside the Next bundle.
import { and, eq } from "drizzle-orm";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the real environment
}

import { hashPassword } from "@/server/auth/password";
import { getDb, getPool } from "@/server/db/client";
import {
  addressAddress,
  salonSalon,
  salonSalonAddresses,
  userExtendeduser,
  userExtendeduserSalons,
} from "@/server/db/schema";

const DEFAULT_REMINDER_MINUTES = 30;

function env(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

async function main() {
  console.log("Starting database seeding...");

  const salonName = env("SEED_SALON_NAME", "Default Salon");
  const salonPhone = env("SEED_SALON_PHONE_NUMBER", "+447700900000");
  const street = env("SEED_SALON_STREET", "123 Default St");
  const city = env("SEED_SALON_CITY", "London");
  const postalCode = env("SEED_SALON_POSTAL_CODE", "SW1A 1AA");

  const ownerEmail = env("SEED_OWNER_EMAIL", "owner@example.com");
  const ownerPhone = env("SEED_OWNER_PHONE_NUMBER", "+447700900001");
  const ownerFirstName = env("SEED_OWNER_FIRST_NAME", "Default");
  const ownerLastName = env("SEED_OWNER_LAST_NAME", "Owner");
  const ownerFullName = env("SEED_OWNER_FULL_NAME", "Default Owner");
  const ownerPassword = env("SEED_OWNER_DEFAULT_PASSWORD", "defaultpass123");

  if (salonName === "Default Salon" || ownerEmail === "owner@example.com") {
    console.warn(
      "Using default values. Set SEED_* environment variables for custom data."
    );
  }

  // Hash outside the transaction: PBKDF2 is slow and needs no database.
  const passwordHash = await hashPassword(ownerPassword);
  const now = new Date().toISOString();

  const summary = await getDb().transaction(async (tx) => {
    // Address (get or create by street/city/postcode)
    let [address] = await tx
      .select()
      .from(addressAddress)
      .where(
        and(
          eq(addressAddress.street, street),
          eq(addressAddress.city, city),
          eq(addressAddress.postalCode, postalCode)
        )
      )
      .limit(1);
    if (address) {
      console.warn(
        `Address already exists: ${address.street}, ${address.city} ${address.postalCode}`
      );
    } else {
      [address] = await tx
        .insert(addressAddress)
        .values({ street, city, postalCode, created: now, modified: now })
        .returning();
      console.log(
        `Created address: ${address.street}, ${address.city} ${address.postalCode}`
      );
    }

    // Salon (get or create by name) and its address link
    let [salon] = await tx
      .select()
      .from(salonSalon)
      .where(eq(salonSalon.name, salonName))
      .limit(1);
    const salonCreated = !salon;
    if (salon) {
      console.warn(`Salon already exists: ${salon.name}`);
    } else {
      [salon] = await tx
        .insert(salonSalon)
        .values({
          name: salonName,
          phoneNumber: salonPhone,
          reminderTimeMinutes: DEFAULT_REMINDER_MINUTES,
          created: now,
          modified: now,
        })
        .returning();
      console.log(`Created salon: ${salon.name}`);
    }
    const [addressLink] = await tx
      .select({ id: salonSalonAddresses.id })
      .from(salonSalonAddresses)
      .where(
        and(
          eq(salonSalonAddresses.salonId, salon.id),
          eq(salonSalonAddresses.addressId, address.id)
        )
      )
      .limit(1);
    if (!addressLink) {
      await tx
        .insert(salonSalonAddresses)
        .values({ salonId: salon.id, addressId: address.id });
      if (!salonCreated) console.log("Associated address with existing salon");
    }

    // Owner user (get or create by email) and its salon link
    let [user] = await tx
      .select()
      .from(userExtendeduser)
      .where(eq(userExtendeduser.email, ownerEmail))
      .limit(1);
    if (user) {
      console.warn(`User already exists: ${user.email}`);
    } else {
      [user] = await tx
        .insert(userExtendeduser)
        .values({
          email: ownerEmail,
          password: passwordHash,
          firstName: ownerFirstName,
          lastName: ownerLastName,
          fullName: ownerFullName,
          phoneNumber: ownerPhone,
          isSuperuser: true,
          isOwner: true,
          isStaff: true,
          isActive: true,
          dateJoined: now,
          lastLogin: null,
          created: now,
          modified: now,
        })
        .returning();
      console.log(`Created owner user: ${user.fullName} (${user.email})`);
      if (ownerPassword === "defaultpass123") {
        console.warn("Default password set (Please change this!)");
      }
    }
    const [userLink] = await tx
      .select({ id: userExtendeduserSalons.id })
      .from(userExtendeduserSalons)
      .where(
        and(
          eq(userExtendeduserSalons.extendeduserId, user.id),
          eq(userExtendeduserSalons.salonId, salon.id)
        )
      )
      .limit(1);
    if (!userLink) {
      await tx
        .insert(userExtendeduserSalons)
        .values({ extendeduserId: user.id, salonId: salon.id });
      console.log("Added salon to user");
    }

    return { salon, address, user };
  });

  console.log("\n=== Seeding Complete ===");
  console.log(`Salon: ${summary.salon.name}`);
  console.log(`Phone Number: ${summary.salon.phoneNumber}`);
  console.log(
    `Address: ${summary.address.street}, ${summary.address.city} ${summary.address.postalCode}`
  );
  console.log(
    `Owner: ${summary.user.fullName} (${summary.user.email}) (${summary.user.phoneNumber})`
  );
  console.log("========================\n");
}

main()
  .catch((error) => {
    console.error("Error during seeding:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => getPool().end());
