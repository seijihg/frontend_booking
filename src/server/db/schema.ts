import { pgTable, bigint, varchar, timestamp, unique, integer, index, foreignKey, check, boolean, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const salonSalonAddresses = pgTable("salon_salon_addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "salon_salon_addresses_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	salonId: bigint("salon_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	addressId: bigint("address_id", { mode: "number" }).notNull(),
}, (table) => [
	index("salon_salon_addresses_address_id_90bf9575").using("btree", table.addressId.asc().nullsLast().op("int8_ops")),
	index("salon_salon_addresses_salon_id_b14321bf").using("btree", table.salonId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.salonId],
			foreignColumns: [salonSalon.id],
			name: "salon_salon_addresses_salon_id_b14321bf_fk_salon_salon_id"
		}),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [addressAddress.id],
			name: "salon_salon_addresses_address_id_90bf9575_fk_address_address_id"
		}),
	unique("salon_salon_addresses_salon_id_address_id_33f3af96_uniq").on(table.salonId, table.addressId),
]);

export const addressAddress = pgTable("address_address", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "address_address_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	modified: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	street: varchar({ length: 255 }).notNull(),
	city: varchar({ length: 255 }).notNull(),
	postalCode: varchar("postal_code", { length: 8 }).notNull(),
});

export const salonSalon = pgTable("salon_salon", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "salon_salon_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	phoneNumber: varchar("phone_number", { length: 128 }).notNull(),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	modified: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	reminderTimeMinutes: integer("reminder_time_minutes").notNull(),
}, (table) => [
	check("salon_salon_reminder_time_minutes_check", sql`reminder_time_minutes >= 0`),
]);

export const userExtendeduser = pgTable("user_extendeduser", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "user_extendeduser_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	password: varchar({ length: 128 }).notNull(),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }),
	isSuperuser: boolean("is_superuser").notNull(),
	firstName: varchar("first_name", { length: 150 }).notNull(),
	lastName: varchar("last_name", { length: 150 }).notNull(),
	isStaff: boolean("is_staff").notNull(),
	isActive: boolean("is_active").notNull(),
	dateJoined: timestamp("date_joined", { withTimezone: true, mode: 'string' }).notNull(),
	phoneNumber: varchar("phone_number", { length: 128 }).notNull(),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	modified: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	email: varchar({ length: 254 }).notNull(),
	isOwner: boolean("is_owner").notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
}, (table) => [
	index("user_extendeduser_email_f00d38a4_like").using("btree", table.email.asc().nullsLast().op("varchar_pattern_ops")),
	unique("user_extendeduser_email_key").on(table.email),
]);

export const userExtendeduserAddresses = pgTable("user_extendeduser_addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "user_extendeduser_addresses_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	extendeduserId: bigint("extendeduser_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	addressId: bigint("address_id", { mode: "number" }).notNull(),
}, (table) => [
	index("user_extendeduser_addresses_address_id_07e1a8ed").using("btree", table.addressId.asc().nullsLast().op("int8_ops")),
	index("user_extendeduser_addresses_extendeduser_id_02ad5e8c").using("btree", table.extendeduserId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.extendeduserId],
			foreignColumns: [userExtendeduser.id],
			name: "user_extendeduser_ad_extendeduser_id_02ad5e8c_fk_user_exte"
		}),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [addressAddress.id],
			name: "user_extendeduser_ad_address_id_07e1a8ed_fk_address_a"
		}),
	unique("user_extendeduser_addres_extendeduser_id_address__f8f73ebc_uniq").on(table.extendeduserId, table.addressId),
]);

export const userExtendeduserSalons = pgTable("user_extendeduser_salons", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "user_extendeduser_salons_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	extendeduserId: bigint("extendeduser_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	salonId: bigint("salon_id", { mode: "number" }).notNull(),
}, (table) => [
	index("user_extendeduser_salons_extendeduser_id_0b159c83").using("btree", table.extendeduserId.asc().nullsLast().op("int8_ops")),
	index("user_extendeduser_salons_salon_id_7d63720a").using("btree", table.salonId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.extendeduserId],
			foreignColumns: [userExtendeduser.id],
			name: "user_extendeduser_sa_extendeduser_id_0b159c83_fk_user_exte"
		}),
	foreignKey({
			columns: [table.salonId],
			foreignColumns: [salonSalon.id],
			name: "user_extendeduser_salons_salon_id_7d63720a_fk_salon_salon_id"
		}),
	unique("user_extendeduser_salons_extendeduser_id_salon_id_e05983b9_uniq").on(table.extendeduserId, table.salonId),
]);

export const customerCustomer = pgTable("customer_customer", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "customer_customer_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	phoneNumber: varchar("phone_number", { length: 128 }).notNull(),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	modified: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
}, (table) => [
	index("customer_customer_phone_number_idx").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
]);

export const appointmentAppointment = pgTable("appointment_appointment", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "appointment_appointment_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	modified: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	appointmentTime: timestamp("appointment_time", { withTimezone: true, mode: 'string' }).notNull(),
	comment: text().notNull(),
	columnId: integer("column_id").notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	salonId: bigint("salon_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true, mode: 'string' }),
	confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("appointment_appointment_customer_id_92575998").using("btree", table.customerId.asc().nullsLast().op("int8_ops")),
	index("appointment_appointment_reminder_pending_idx").using("btree", table.appointmentTime.asc().nullsLast().op("timestamptz_ops")).where(sql`(reminder_sent_at IS NULL)`),
	index("appointment_appointment_salon_id_appointment_time_idx").using("btree", table.salonId.asc().nullsLast().op("int8_ops"), table.appointmentTime.asc().nullsLast().op("timestamptz_ops")),
	index("appointment_appointment_salon_id_e59561a4").using("btree", table.salonId.asc().nullsLast().op("int8_ops")),
	index("appointment_appointment_user_id_2ab0376a").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customerCustomer.id],
			name: "appointment_appointm_customer_id_92575998_fk_customer_"
		}),
	foreignKey({
			columns: [table.salonId],
			foreignColumns: [salonSalon.id],
			name: "appointment_appointment_salon_id_e59561a4_fk_salon_salon_id"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userExtendeduser.id],
			name: "appointment_appointm_user_id_2ab0376a_fk_user_exte"
		}),
]);

export const customerCustomerSalons = pgTable("customer_customer_salons", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "customer_customer_salons_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	salonId: bigint("salon_id", { mode: "number" }).notNull(),
}, (table) => [
	index("customer_customer_salons_customer_id_3f6fb9c4").using("btree", table.customerId.asc().nullsLast().op("int8_ops")),
	index("customer_customer_salons_salon_id_a0e2555a").using("btree", table.salonId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customerCustomer.id],
			name: "customer_customer_sa_customer_id_3f6fb9c4_fk_customer_"
		}),
	foreignKey({
			columns: [table.salonId],
			foreignColumns: [salonSalon.id],
			name: "customer_customer_salons_salon_id_a0e2555a_fk_salon_salon_id"
		}),
	unique("customer_customer_salons_customer_id_salon_id_9d5a073a_uniq").on(table.customerId, table.salonId),
]);
