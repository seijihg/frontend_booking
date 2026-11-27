import { z } from "zod";

import { phoneNumberSchema } from "./phone";
import { postcodeSchema } from "./postcode";

export const addressInputSchema = z.object({
  id: z.number().int().positive().optional(),
  street: z.string().max(255).default(""),
  city: z.string().max(255).default(""),
  postal_code: postcodeSchema.default(""),
});

const nameSchema = z.string().min(1).max(255);
const reminderSchema = z.number().int().min(0);

export const salonCreateSchema = z.object({
  name: nameSchema,
  phone_number: phoneNumberSchema,
  addresses: z.array(addressInputSchema).min(1, "Address cannot be an empty list."),
  reminder_time_minutes: reminderSchema.default(60),
});

export const salonPatchSchema = z
  .object({
    name: nameSchema.optional(),
    phone_number: phoneNumberSchema.optional(),
    addresses: z.array(addressInputSchema).optional(),
    reminder_time_minutes: reminderSchema.optional(),
  })
  .strict();

export type AddressInput = z.infer<typeof addressInputSchema>;
export type SalonCreateInput = z.infer<typeof salonCreateSchema>;
export type SalonPatchInput = z.infer<typeof salonPatchSchema>;
