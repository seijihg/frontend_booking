import { describe, expect, it } from "vitest";
import { z } from "zod";

import { forbidden, notFound, unauthorized, zodToFieldErrors } from "./errors";

describe("zodToFieldErrors", () => {
  it("maps field and nested issues", () => {
    const schema = z.object({
      email: z.string().email("bad email"),
      address: z.object({ postcode: z.string().min(3, "too short") }),
    });
    const res = schema.safeParse({ email: "x", address: { postcode: "a" } });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(zodToFieldErrors(res.error)).toEqual({
        email: ["bad email"],
        "address.postcode": ["too short"],
      });
    }
  });

  it("puts root issues under non_field_errors", () => {
    const schema = z.object({}).refine(() => false, "nope");
    const res = schema.safeParse({});
    if (res.success) throw new Error("expected failure");
    expect(zodToFieldErrors(res.error)).toEqual({ non_field_errors: ["nope"] });
  });
});

describe("ApiError helpers", () => {
  it("carry DRF status and body", () => {
    expect(unauthorized()).toMatchObject({
      status: 401,
      body: { detail: "Authentication credentials were not provided." },
    });
    expect(notFound()).toMatchObject({
      status: 404,
      body: { detail: "Not found." },
    });
    expect(forbidden()).toMatchObject({
      status: 403,
      body: { detail: "You do not have permission to perform this action." },
    });
  });
});
