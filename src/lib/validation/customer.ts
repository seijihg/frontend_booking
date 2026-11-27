import { z } from "zod";

import { phoneNumberSchema } from "./phone";

const SALON_IDS_EMPTY = "At least one salon must be assigned to the customer.";
const salonIdsSchema = z.array(z.number().int().positive()).min(1, SALON_IDS_EMPTY);
const fullNameSchema = z.string().max(150);

export const customerCreateSchema = z.object({
  full_name: fullNameSchema.default(""),
  phone_number: phoneNumberSchema,
  salon_ids: salonIdsSchema,
});

export const customerPatchSchema = z
  .object({
    full_name: fullNameSchema.optional(),
    phone_number: phoneNumberSchema.optional(),
    salon_ids: salonIdsSchema.optional(),
  })
  .strict();

export const CUSTOMER_SORT_FIELDS = [
  "id",
  "full_name",
  "phone_number",
  "created",
  "modified",
] as const;

/** Invalid values fall back to defaults instead of erroring. */
export const customerListQuerySchema = z.object({
  salon: z.coerce.number().int().positive().optional().catch(undefined),
  sort_by: z.enum(CUSTOMER_SORT_FIELDS).catch("created"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerPatchInput = z.infer<typeof customerPatchSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
