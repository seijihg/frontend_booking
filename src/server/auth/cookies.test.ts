import { describe, expect, it } from "vitest";

import { accessCookieOptions, refreshCookieOptions } from "./cookies";

describe("cookie options", () => {
  it("are httpOnly, lax, path / with the right lifetimes", () => {
    expect(accessCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    expect(refreshCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    expect(accessCookieOptions()).not.toHaveProperty("domain");
  });
});
