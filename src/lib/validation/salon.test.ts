import { describe, expect, it } from "vitest";

import { salonCreateSchema, salonPatchSchema } from "./salon";

const addr = { street: "1 St", city: "X", postal_code: "HP4 3AP" };

describe("salonCreateSchema", () => {
  it("applies defaults and normalises the phone", () => {
    const out = salonCreateSchema.parse({
      name: "S",
      phone_number: "01442 000000",
      addresses: [{}],
    });
    expect(out.phone_number).toBe("+441442000000");
    expect(out.reminder_time_minutes).toBe(60);
    expect(out.addresses[0]).toEqual({ street: "", city: "", postal_code: "" });
  });

  it("rejects an empty address list with the legacy message", () => {
    const r = salonCreateSchema.safeParse({
      name: "S",
      phone_number: "+441442000000",
      addresses: [],
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("Address cannot be an empty list.");
  });

  it("rejects negative reminder and bad postcode", () => {
    expect(
      salonCreateSchema.safeParse({
        name: "S",
        phone_number: "+441442000000",
        addresses: [{ ...addr, postal_code: "zz" }],
      }).success
    ).toBe(false);
    expect(
      salonCreateSchema.safeParse({
        name: "S",
        phone_number: "+441442000000",
        addresses: [addr],
        reminder_time_minutes: -1,
      }).success
    ).toBe(false);
  });
});

describe("salonPatchSchema", () => {
  it("is partial and does not inject defaults", () => {
    expect(salonPatchSchema.parse({ reminder_time_minutes: 30 })).toEqual({
      reminder_time_minutes: 30,
    });
    expect(salonPatchSchema.parse({})).toEqual({});
  });
  it("accepts addresses with or without id", () => {
    const out = salonPatchSchema.parse({ addresses: [{ id: 3, ...addr }, addr] });
    expect(out.addresses?.[0].id).toBe(3);
    expect(out.addresses?.[1].id).toBeUndefined();
  });
  it("rejects unknown keys", () => {
    expect(salonPatchSchema.safeParse({ bogus: 1 }).success).toBe(false);
  });
});
