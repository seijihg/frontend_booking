import { describe, expect, it } from "vitest";

import { authorizeCron } from "./cron";

const secret = "0123456789abcdef-secret";

describe("authorizeCron", () => {
  it("accepts the matching bearer token", () => {
    expect(authorizeCron(`Bearer ${secret}`, secret)).toBe("ok");
  });
  it("rejects a wrong token of the same length", () => {
    expect(authorizeCron(`Bearer ${secret.replace("0", "1")}`, secret)).toBe("unauthorized");
  });
  it("rejects a token of a different length", () => {
    expect(authorizeCron(`Bearer ${secret}x`, secret)).toBe("unauthorized");
    expect(authorizeCron("Bearer", secret)).toBe("unauthorized");
  });
  it("rejects a missing header", () => {
    expect(authorizeCron(null, secret)).toBe("unauthorized");
  });
  it("reports unconfigured when the secret is unset", () => {
    expect(authorizeCron(`Bearer ${secret}`, undefined)).toBe("unconfigured");
    expect(authorizeCron(null, undefined)).toBe("unconfigured");
  });
});
