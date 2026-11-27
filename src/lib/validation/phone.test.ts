import { describe, expect, it } from "vitest";

import { normalizePhoneNumber, phoneNumberSchema } from "./phone";

describe("normalizePhoneNumber", () => {
  it.each([
    ["+447700900123", "+447700900123"],
    ["07700 900123", "+447700900123"],
    ["(07700) 900-123", "+447700900123"],
    ["07700.900.123", "+447700900123"],
    ["447700900123", "+447700900123"],
    ["+1 202 555 0100", "+12025550100"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "12345", "0770090012", "+1234567", "+1234567890123456", "077009001234"])(
    "rejects %j",
    (input) => {
      expect(normalizePhoneNumber(input)).toBeNull();
    }
  );
});

describe("phoneNumberSchema", () => {
  it("transforms to E.164", () => {
    expect(phoneNumberSchema.parse("07700 900123")).toBe("+447700900123");
  });
  it("fails with the legacy message", () => {
    const r = phoneNumberSchema.safeParse("nope");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Enter a valid phone number.");
  });
});
