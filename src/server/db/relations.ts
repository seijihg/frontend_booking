import { relations } from "drizzle-orm/relations";
import { salonSalon, salonSalonAddresses, addressAddress, djangoContentType, authPermission, authGroup, authGroupPermissions, userExtendeduser, userExtendeduserAddresses, userExtendeduserGroups, userExtendeduserSalons, userExtendeduserUserPermissions, accountEmailaddress, accountEmailconfirmation, djangoAdminLog, authtokenToken, customerCustomer, appointmentAppointment, customerCustomerSalons, socialaccountSocialapp, socialaccountSocialappSites, djangoSite, socialaccountSocialaccount, socialaccountSocialtoken } from "./schema";

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

export const authPermissionRelations = relations(authPermission, ({one, many}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [authPermission.contentTypeId],
		references: [djangoContentType.id]
	}),
	authGroupPermissions: many(authGroupPermissions),
	userExtendeduserUserPermissions: many(userExtendeduserUserPermissions),
}));

export const djangoContentTypeRelations = relations(djangoContentType, ({many}) => ({
	authPermissions: many(authPermission),
	djangoAdminLogs: many(djangoAdminLog),
}));

export const authGroupPermissionsRelations = relations(authGroupPermissions, ({one}) => ({
	authGroup: one(authGroup, {
		fields: [authGroupPermissions.groupId],
		references: [authGroup.id]
	}),
	authPermission: one(authPermission, {
		fields: [authGroupPermissions.permissionId],
		references: [authPermission.id]
	}),
}));

export const authGroupRelations = relations(authGroup, ({many}) => ({
	authGroupPermissions: many(authGroupPermissions),
	userExtendeduserGroups: many(userExtendeduserGroups),
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
	userExtendeduserGroups: many(userExtendeduserGroups),
	userExtendeduserSalons: many(userExtendeduserSalons),
	userExtendeduserUserPermissions: many(userExtendeduserUserPermissions),
	accountEmailaddresses: many(accountEmailaddress),
	djangoAdminLogs: many(djangoAdminLog),
	authtokenTokens: many(authtokenToken),
	appointmentAppointments: many(appointmentAppointment),
	socialaccountSocialaccounts: many(socialaccountSocialaccount),
}));

export const userExtendeduserGroupsRelations = relations(userExtendeduserGroups, ({one}) => ({
	userExtendeduser: one(userExtendeduser, {
		fields: [userExtendeduserGroups.extendeduserId],
		references: [userExtendeduser.id]
	}),
	authGroup: one(authGroup, {
		fields: [userExtendeduserGroups.groupId],
		references: [authGroup.id]
	}),
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

export const userExtendeduserUserPermissionsRelations = relations(userExtendeduserUserPermissions, ({one}) => ({
	userExtendeduser: one(userExtendeduser, {
		fields: [userExtendeduserUserPermissions.extendeduserId],
		references: [userExtendeduser.id]
	}),
	authPermission: one(authPermission, {
		fields: [userExtendeduserUserPermissions.permissionId],
		references: [authPermission.id]
	}),
}));

export const accountEmailaddressRelations = relations(accountEmailaddress, ({one, many}) => ({
	userExtendeduser: one(userExtendeduser, {
		fields: [accountEmailaddress.userId],
		references: [userExtendeduser.id]
	}),
	accountEmailconfirmations: many(accountEmailconfirmation),
}));

export const accountEmailconfirmationRelations = relations(accountEmailconfirmation, ({one}) => ({
	accountEmailaddress: one(accountEmailaddress, {
		fields: [accountEmailconfirmation.emailAddressId],
		references: [accountEmailaddress.id]
	}),
}));

export const djangoAdminLogRelations = relations(djangoAdminLog, ({one}) => ({
	djangoContentType: one(djangoContentType, {
		fields: [djangoAdminLog.contentTypeId],
		references: [djangoContentType.id]
	}),
	userExtendeduser: one(userExtendeduser, {
		fields: [djangoAdminLog.userId],
		references: [userExtendeduser.id]
	}),
}));

export const authtokenTokenRelations = relations(authtokenToken, ({one}) => ({
	userExtendeduser: one(userExtendeduser, {
		fields: [authtokenToken.userId],
		references: [userExtendeduser.id]
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

export const socialaccountSocialappSitesRelations = relations(socialaccountSocialappSites, ({one}) => ({
	socialaccountSocialapp: one(socialaccountSocialapp, {
		fields: [socialaccountSocialappSites.socialappId],
		references: [socialaccountSocialapp.id]
	}),
	djangoSite: one(djangoSite, {
		fields: [socialaccountSocialappSites.siteId],
		references: [djangoSite.id]
	}),
}));

export const socialaccountSocialappRelations = relations(socialaccountSocialapp, ({many}) => ({
	socialaccountSocialappSites: many(socialaccountSocialappSites),
	socialaccountSocialtokens: many(socialaccountSocialtoken),
}));

export const djangoSiteRelations = relations(djangoSite, ({many}) => ({
	socialaccountSocialappSites: many(socialaccountSocialappSites),
}));

export const socialaccountSocialtokenRelations = relations(socialaccountSocialtoken, ({one}) => ({
	socialaccountSocialaccount: one(socialaccountSocialaccount, {
		fields: [socialaccountSocialtoken.accountId],
		references: [socialaccountSocialaccount.id]
	}),
	socialaccountSocialapp: one(socialaccountSocialapp, {
		fields: [socialaccountSocialtoken.appId],
		references: [socialaccountSocialapp.id]
	}),
}));

export const socialaccountSocialaccountRelations = relations(socialaccountSocialaccount, ({one, many}) => ({
	socialaccountSocialtokens: many(socialaccountSocialtoken),
	userExtendeduser: one(userExtendeduser, {
		fields: [socialaccountSocialaccount.userId],
		references: [userExtendeduser.id]
	}),
}));