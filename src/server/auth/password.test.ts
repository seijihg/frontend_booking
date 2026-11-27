import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

const DJANGO_HASH =
  "pbkdf2_sha256$1000000$2T9F2unzW77lPcG8NM7nIM$ptNUvFuklF9EOrN9vWUyIHEKl1hpvh4i9uhlOWTMU5s=";

describe("verifyPassword", () => {
  it("accepts the Django fixture", async () => {
    expect(await verifyPassword("defaultpass123", DJANGO_HASH)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    expect(await verifyPassword("wrong", DJANGO_HASH)).toBe(false);
  });

  it("returns false for malformed hashes", async () => {
    for (const bad of ["", "md5$x$y", "pbkdf2_sha256$abc$s$h"]) {
      expect(await verifyPassword("defaultpass123", bad)).toBe(false);
    }
  });
});

describe("hashPassword", () => {
  it("round-trips in Django format", async () => {
    const hash = await hashPassword("a-new-password");
    expect(hash.startsWith("pbkdf2_sha256$1000000$")).toBe(true);
    expect(hash.split("$")[2]).toHaveLength(22);
    expect(await verifyPassword("a-new-password", hash)).toBe(true);
    expect(await verifyPassword("other", hash)).toBe(false);
  });
});
