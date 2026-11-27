import { z } from "zod";

export const POSTCODE_ERROR = "Invalid UK postcode.";

export const UK_POSTCODE_RE =
  /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})/;

/** Blank is allowed; otherwise the value must contain a UK postcode (legacy `re.search`). */
export const postcodeSchema = z
  .string()
  .max(8)
  .refine((v) => v.trim() === "" || UK_POSTCODE_RE.test(v), POSTCODE_ERROR);
