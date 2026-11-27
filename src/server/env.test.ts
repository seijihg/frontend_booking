import { afterEach, describe, expect, it, vi } from "vitest";

import { getEnv, resetEnvForTests } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvForTests();
});

describe("getEnv", () => {
  it("throws naming the missing key", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("LEGACY_API_URL", "http://localhost:8000/");
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it("returns validated values and memoises", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5433/db");
    vi.stubEnv("LEGACY_API_URL", "http://localhost:8000/");
    const a = getEnv();
    expect(a.LEGACY_API_URL).toBe("http://localhost:8000/");
    expect(getEnv()).toBe(a);
  });
});
