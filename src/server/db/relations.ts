import { relations } from "drizzle-orm/relations";
import { salonSalon, salonSalonAddresses, addressAddress, userExtendeduser, userExtendeduserAddresses, userExtendeduserSalons, customerCustomer, appointmentAppointment, customerCustomerSalons } from "./schema";

export const salonSalonAddressesRelations = relations(salonSalonAddresses, ({one}) => ({
	salonSalon: one(salonSalon, {
		fields: [salonSalonAddresses.salonId],
		references: [salonSalon.id]
	}),
	addressAddress: one(addressAddress, {
		fields: [salonSalonAddresses.addressId],
		references: [addressAddress.id]
	}),
}));

export const salonSalonRelations = relations(salonSalon, ({many}) => ({
	salonSalonAddresses: many(salonSalonAddresses),
	userExtendeduserSalons: many(userExtendeduserSalons),
	appointmentAppointments: many(appointmentAppointment),
	customerCustomerSalons: many(customerCustomerSalons),
}));

export const addressAddressRelations = relations(addressAddress, ({many}) => ({
	salonSalonAddresses: many(salonSalonAddresses),
	userExtendeduserAddresses: many(userExtendeduserAddresses),
}));

export const userExtendeduserAddressesRelations = relations(userExtendeduserAddresses, ({one}) => ({
	userExtendeduser: one(userExtendeduser, {
		fields: [userExtendeduserAddresses.extendeduserId],
		references: [userExtendeduser.id]
	}),
	addressAddress: one(addressAddress, {
		fields: [userExtendeduserAddresses.addressId],
		references: [addressAddress.id]
	}),
}));

export const userExtendeduserRelations = relations(userExtendeduser, ({many}) => ({
	userExtendeduserAddresses: many(userExtendeduserAddresses),
	userExtendeduserSalons: many(userExtendeduserSalons),
	appointmentAppointments: many(appointmentAppointment),
}));

export const userExtendeduserSalonsRelations = relations(userExtendeduserSalons, ({one}) => ({
	userExtendeduser: one(userExtendeduser, {
		fields: [userExtendeduserSalons.extendeduserId],
		references: [userExtendeduser.id]
	}),
	salonSalon: one(salonSalon, {
		fields: [userExtendeduserSalons.salonId],
		references: [salonSalon.id]
	}),
}));

export const appointmentAppointmentRelations = relations(appointmentAppointment, ({one}) => ({
	customerCustomer: one(customerCustomer, {
		fields: [appointmentAppointment.customerId],
		references: [customerCustomer.id]
	}),
	salonSalon: one(salonSalon, {
		fields: [appointmentAppointment.salonId],
		references: [salonSalon.id]
	}),
	userExtendeduser: one(userExtendeduser, {
		fields: [appointmentAppointment.userId],
		references: [userExtendeduser.id]
	}),
}));

export const customerCustomerRelations = relations(customerCustomer, ({many}) => ({
	appointmentAppointments: many(appointmentAppointment),
	customerCustomerSalons: many(customerCustomerSalons),
}));

export const customerCustomerSalonsRelations = relations(customerCustomerSalons, ({one}) => ({
	customerCustomer: one(customerCustomer, {
		fields: [customerCustomerSalons.customerId],
		references: [customerCustomer.id]
	}),
	salonSalon: one(salonSalon, {
		fields: [customerCustomerSalons.salonId],
		references: [salonSalon.id]
	}),
}));
