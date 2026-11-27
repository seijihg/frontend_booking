import { describe, expect, it } from "vitest";

import { clientKey, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit then blocks, per key", () => {
    const rl = createRateLimiter(3, 1000, () => 0);
    expect([1, 2, 3].map(() => rl.attempt("a"))).toEqual([true, true, true]);
    expect(rl.attempt("a")).toBe(false);
    expect(rl.attempt("b")).toBe(true);
  });

  it("resets after the window", () => {
    let t = 0;
    const rl = createRateLimiter(1, 1000, () => t);
    expect(rl.attempt("a")).toBe(true);
    expect(rl.attempt("a")).toBe(false);
    t = 1000;
    expect(rl.attempt("a")).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded hop or unknown", () => {
    expect(
      clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))
    ).toBe("1.2.3.4");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
