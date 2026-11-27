import { z } from "zod";

export const PHONE_ERROR = "Enter a valid phone number.";

/**
 * Normalises a phone number to E.164. Accepts E.164 as-is and UK national
 * input (`07700 900123`, `447700900123`). Returns null when it cannot.
 */
export function normalizePhoneNumber(input: string): string | null {
  const stripped = input.replace(/[\s\-.()]/g, "");
  if (/^\+\d{8,15}$/.test(stripped)) return stripped;
  if (/^0\d{10}$/.test(stripped)) return `+44${stripped.slice(1)}`;
  if (/^44\d{10}$/.test(stripped)) return `+${stripped}`;
  return null;
}

export const phoneNumberSchema = z
  .string()
  .refine((v) => normalizePhoneNumber(v) !== null, PHONE_ERROR)
  .transform((v) => normalizePhoneNumber(v) ?? v);
