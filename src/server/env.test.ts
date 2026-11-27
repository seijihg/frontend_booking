import { afterEach, describe, expect, it, vi } from "vitest";

import { getEnv, resetEnvForTests } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvForTests();
});

describe("getEnv", () => {
  it("throws naming the missing key", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it("returns validated values and memoises", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5433/db");
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));
    const a = getEnv();
    expect(a.DATABASE_URL).toBe("postgresql://u:p@localhost:5433/db");
    expect(getEnv()).toBe(a);
  });
});
