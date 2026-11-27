import { describe, expect, it } from "vitest";

import { customerCreateSchema, customerListQuerySchema, customerPatchSchema } from "./customer";

describe("customerCreateSchema", () => {
  it("defaults full_name and normalises phone", () => {
    expect(customerCreateSchema.parse({ phone_number: "07700900555", salon_ids: [1] })).toEqual({
      full_name: "",
      phone_number: "+447700900555",
      salon_ids: [1],
    });
  });
  it("requires non-empty salon_ids with the legacy message", () => {
    const r = customerCreateSchema.safeParse({ phone_number: "07700900555", salon_ids: [] });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe(
        "At least one salon must be assigned to the customer."
      );
    }
  });
  it("rejects over-long names", () => {
    expect(
      customerCreateSchema.safeParse({
        full_name: "x".repeat(151),
        phone_number: "07700900555",
        salon_ids: [1],
      }).success
    ).toBe(false);
  });
});

describe("customerPatchSchema", () => {
  it("is partial and strict", () => {
    expect(customerPatchSchema.parse({ full_name: "A" })).toEqual({ full_name: "A" });
    expect(customerPatchSchema.safeParse({ nope: 1 }).success).toBe(false);
  });
});

describe("customerListQuerySchema", () => {
  it("falls back to defaults", () => {
    expect(customerListQuerySchema.parse({})).toEqual({ sort_by: "created", order: "desc" });
    expect(
      customerListQuerySchema.parse({ sort_by: "evil", order: "up", salon: "abc" })
    ).toEqual({ sort_by: "created", order: "desc" });
  });
  it("coerces salon and keeps valid sorting", () => {
    expect(
      customerListQuerySchema.parse({ salon: "2", sort_by: "full_name", order: "asc" })
    ).toEqual({ salon: 2, sort_by: "full_name", order: "asc" });
  });
});
