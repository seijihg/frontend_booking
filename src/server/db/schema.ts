import { customType, pgTable, bigint, varchar, timestamp, unique, integer, index, foreignKey, check, boolean, uniqueIndex, text, smallint, uuid, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});



export const djangoMigrations = pgTable("django_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "django_migrations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	app: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	applied: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
});

export const djangoContentType = pgTable("django_content_type", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_content_type_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	appLabel: varchar("app_label", { length: 100 }).notNull(),
	model: varchar({ length: 100 }).notNull(),
}, (table) => [
	unique("django_content_type_app_label_model_76bd3d3b_uniq").on(table.appLabel, table.model),
]);

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

export const authPermission = pgTable("auth_permission", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_permission_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	contentTypeId: integer("content_type_id").notNull(),
	codename: varchar({ length: 100 }).notNull(),
}, (table) => [
	index("auth_permission_content_type_id_2f476e4b").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "auth_permission_content_type_id_2f476e4b_fk_django_co"
		}),
	unique("auth_permission_content_type_id_codename_01ab375a_uniq").on(table.contentTypeId, table.codename),
]);

export const authGroup = pgTable("auth_group", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "auth_group_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 150 }).notNull(),
}, (table) => [
	index("auth_group_name_a6ea08ec_like").using("btree", table.name.asc().nullsLast().op("varchar_pattern_ops")),
	unique("auth_group_name_key").on(table.name),
]);

export const authGroupPermissions = pgTable("auth_group_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "auth_group_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	groupId: integer("group_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	index("auth_group_permissions_group_id_b120cbf9").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	index("auth_group_permissions_permission_id_84c5c92e").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [authGroup.id],
			name: "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id"
		}),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [authPermission.id],
			name: "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm"
		}),
	unique("auth_group_permissions_group_id_permission_id_0cd325b0_uniq").on(table.groupId, table.permissionId),
]);

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

export const userExtendeduserGroups = pgTable("user_extendeduser_groups", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "user_extendeduser_groups_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	extendeduserId: bigint("extendeduser_id", { mode: "number" }).notNull(),
	groupId: integer("group_id").notNull(),
}, (table) => [
	index("user_extendeduser_groups_extendeduser_id_dfc61db6").using("btree", table.extendeduserId.asc().nullsLast().op("int8_ops")),
	index("user_extendeduser_groups_group_id_1478b193").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.extendeduserId],
			foreignColumns: [userExtendeduser.id],
			name: "user_extendeduser_gr_extendeduser_id_dfc61db6_fk_user_exte"
		}),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [authGroup.id],
			name: "user_extendeduser_groups_group_id_1478b193_fk_auth_group_id"
		}),
	unique("user_extendeduser_groups_extendeduser_id_group_id_d4fe5d37_uniq").on(table.extendeduserId, table.groupId),
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

export const userExtendeduserUserPermissions = pgTable("user_extendeduser_user_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "user_extendeduser_user_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	extendeduserId: bigint("extendeduser_id", { mode: "number" }).notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	index("user_extendeduser_user_permissions_extendeduser_id_1a8781d3").using("btree", table.extendeduserId.asc().nullsLast().op("int8_ops")),
	index("user_extendeduser_user_permissions_permission_id_93eeca36").using("btree", table.permissionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.extendeduserId],
			foreignColumns: [userExtendeduser.id],
			name: "user_extendeduser_us_extendeduser_id_1a8781d3_fk_user_exte"
		}),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [authPermission.id],
			name: "user_extendeduser_us_permission_id_93eeca36_fk_auth_perm"
		}),
	unique("user_extendeduser_user_p_extendeduser_id_permissi_ec240fdc_uniq").on(table.extendeduserId, table.permissionId),
]);

export const accountEmailaddress = pgTable("account_emailaddress", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "account_emailaddress_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	email: varchar({ length: 254 }).notNull(),
	verified: boolean().notNull(),
	primary: boolean().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
}, (table) => [
	index("account_emailaddress_email_03be32b2").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("account_emailaddress_email_03be32b2_like").using("btree", table.email.asc().nullsLast().op("varchar_pattern_ops")),
	index("account_emailaddress_user_id_2c513194").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	uniqueIndex("unique_primary_email").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.primary.asc().nullsLast().op("bool_ops")).where(sql`"primary"`),
	uniqueIndex("unique_verified_email").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`verified`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userExtendeduser.id],
			name: "account_emailaddress_user_id_2c513194_fk_user_extendeduser_id"
		}),
	unique("account_emailaddress_user_id_email_987c8728_uniq").on(table.email, table.userId),
]);

export const accountEmailconfirmation = pgTable("account_emailconfirmation", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "account_emailconfirmation_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	sent: timestamp({ withTimezone: true, mode: 'string' }),
	key: varchar({ length: 64 }).notNull(),
	emailAddressId: integer("email_address_id").notNull(),
}, (table) => [
	index("account_emailconfirmation_email_address_id_5b7f8c58").using("btree", table.emailAddressId.asc().nullsLast().op("int4_ops")),
	index("account_emailconfirmation_key_f43612bd_like").using("btree", table.key.asc().nullsLast().op("varchar_pattern_ops")),
	foreignKey({
			columns: [table.emailAddressId],
			foreignColumns: [accountEmailaddress.id],
			name: "account_emailconfirm_email_address_id_5b7f8c58_fk_account_e"
		}),
	unique("account_emailconfirmation_key_key").on(table.key),
]);

export const djangoAdminLog = pgTable("django_admin_log", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_admin_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	actionTime: timestamp("action_time", { withTimezone: true, mode: 'string' }).notNull(),
	objectId: text("object_id"),
	objectRepr: varchar("object_repr", { length: 200 }).notNull(),
	actionFlag: smallint("action_flag").notNull(),
	changeMessage: text("change_message").notNull(),
	contentTypeId: integer("content_type_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
}, (table) => [
	index("django_admin_log_content_type_id_c4bce8eb").using("btree", table.contentTypeId.asc().nullsLast().op("int4_ops")),
	index("django_admin_log_user_id_c564eba6").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.contentTypeId],
			foreignColumns: [djangoContentType.id],
			name: "django_admin_log_content_type_id_c4bce8eb_fk_django_co"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userExtendeduser.id],
			name: "django_admin_log_user_id_c564eba6_fk_user_extendeduser_id"
		}),
	check("django_admin_log_action_flag_check", sql`action_flag >= 0`),
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

export const authtokenToken = pgTable("authtoken_token", {
	key: varchar({ length: 40 }).primaryKey().notNull(),
	created: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
}, (table) => [
	index("authtoken_token_key_10f0b77e_like").using("btree", table.key.asc().nullsLast().op("varchar_pattern_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userExtendeduser.id],
			name: "authtoken_token_user_id_35299eff_fk_user_extendeduser_id"
		}),
	unique("authtoken_token_user_id_key").on(table.userId),
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
	taskId: varchar("task_id", { length: 50 }).notNull(),
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

export const djangoDramatiqTask = pgTable("django_dramatiq_task", {
	id: uuid().primaryKey().notNull(),
	status: varchar({ length: 8 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	// TODO: failed to parse database type 'bytea'
	messageData: bytea("message_data").notNull(),
	actorName: varchar("actor_name", { length: 300 }),
	queueName: varchar("queue_name", { length: 100 }),
}, (table) => [
	index("django_dramatiq_task_updated_at_bb623596").using("btree", table.updatedAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const djangoSession = pgTable("django_session", {
	sessionKey: varchar("session_key", { length: 40 }).primaryKey().notNull(),
	sessionData: text("session_data").notNull(),
	expireDate: timestamp("expire_date", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("django_session_expire_date_a5c62663").using("btree", table.expireDate.asc().nullsLast().op("timestamptz_ops")),
	index("django_session_session_key_c0390e0f_like").using("btree", table.sessionKey.asc().nullsLast().op("varchar_pattern_ops")),
]);

export const socialaccountSocialappSites = pgTable("socialaccount_socialapp_sites", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialapp_sites_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	socialappId: integer("socialapp_id").notNull(),
	siteId: integer("site_id").notNull(),
}, (table) => [
	index("socialaccount_socialapp_sites_site_id_2579dee5").using("btree", table.siteId.asc().nullsLast().op("int4_ops")),
	index("socialaccount_socialapp_sites_socialapp_id_97fb6e7d").using("btree", table.socialappId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.socialappId],
			foreignColumns: [socialaccountSocialapp.id],
			name: "socialaccount_social_socialapp_id_97fb6e7d_fk_socialacc"
		}),
	foreignKey({
			columns: [table.siteId],
			foreignColumns: [djangoSite.id],
			name: "socialaccount_social_site_id_2579dee5_fk_django_si"
		}),
	unique("socialaccount_socialapp__socialapp_id_site_id_71a9a768_uniq").on(table.socialappId, table.siteId),
]);

export const djangoSite = pgTable("django_site", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "django_site_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	domain: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
}, (table) => [
	index("django_site_domain_a2e37b91_like").using("btree", table.domain.asc().nullsLast().op("varchar_pattern_ops")),
	unique("django_site_domain_a2e37b91_uniq").on(table.domain),
]);

export const socialaccountSocialtoken = pgTable("socialaccount_socialtoken", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialtoken_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	token: text().notNull(),
	tokenSecret: text("token_secret").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	accountId: integer("account_id").notNull(),
	appId: integer("app_id"),
}, (table) => [
	index("socialaccount_socialtoken_account_id_951f210e").using("btree", table.accountId.asc().nullsLast().op("int4_ops")),
	index("socialaccount_socialtoken_app_id_636a42d7").using("btree", table.appId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [socialaccountSocialaccount.id],
			name: "socialaccount_social_account_id_951f210e_fk_socialacc"
		}),
	foreignKey({
			columns: [table.appId],
			foreignColumns: [socialaccountSocialapp.id],
			name: "socialaccount_social_app_id_636a42d7_fk_socialacc"
		}),
	unique("socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq").on(table.accountId, table.appId),
]);

export const socialaccountSocialapp = pgTable("socialaccount_socialapp", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialapp_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	provider: varchar({ length: 30 }).notNull(),
	name: varchar({ length: 40 }).notNull(),
	clientId: varchar("client_id", { length: 191 }).notNull(),
	secret: varchar({ length: 191 }).notNull(),
	key: varchar({ length: 191 }).notNull(),
	providerId: varchar("provider_id", { length: 200 }).notNull(),
	settings: jsonb().notNull(),
});

export const socialaccountSocialaccount = pgTable("socialaccount_socialaccount", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "socialaccount_socialaccount_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	provider: varchar({ length: 200 }).notNull(),
	uid: varchar({ length: 191 }).notNull(),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }).notNull(),
	dateJoined: timestamp("date_joined", { withTimezone: true, mode: 'string' }).notNull(),
	extraData: jsonb("extra_data").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
}, (table) => [
	index("socialaccount_socialaccount_user_id_8146e70c").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userExtendeduser.id],
			name: "socialaccount_social_user_id_8146e70c_fk_user_exte"
		}),
	unique("socialaccount_socialaccount_provider_uid_fc810c6e_uniq").on(table.provider, table.uid),
]);
