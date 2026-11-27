import { describe, expect, it } from "vitest";

import { UK_POSTCODE_RE, postcodeSchema } from "./postcode";

describe("postcodeSchema", () => {
  it.each(["SW1A 1AA", "hp4 3ap", "GIR 0AA", "HP43AP", ""])("accepts %j", (v) => {
    expect(postcodeSchema.safeParse(v).success).toBe(true);
  });

  it.each(["12345", "zz", "ABCDEFGH"])("rejects %j with the legacy message", (v) => {
    const r = postcodeSchema.safeParse(v);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Invalid UK postcode.");
  });

  it("rejects values over 8 characters", () => {
    expect(postcodeSchema.safeParse("SW1A 1AA 99").success).toBe(false);
  });

  it("matches anywhere like the legacy re.search", () => {
    expect(UK_POSTCODE_RE.test("x HP4 3AP")).toBe(true);
  });
});
