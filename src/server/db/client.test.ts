import { describe, expect, it } from "vitest";

import { upgradeNeonSslMode } from "./client";

describe("upgradeNeonSslMode", () => {
  it("upgrades sslmode=require to verify-full on Neon hosts and keeps other params", () => {
    const out = upgradeNeonSslMode(
      "postgresql://u:p@ep-x-pooler.c-3.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
    );
    expect(out).toBe(
      "postgresql://u:p@ep-x-pooler.c-3.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full"
    );
  });

  it("leaves verify-full and missing sslmode alone", () => {
    const full = "postgresql://u:p@ep-x.neon.tech/db?sslmode=verify-full";
    expect(upgradeNeonSslMode(full)).toBe(full);
    const none = "postgresql://u:p@ep-x.neon.tech/db";
    expect(upgradeNeonSslMode(none)).toBe(none);
  });

  it("does not touch non-Neon hosts or unparsable strings", () => {
    const local = "postgresql://booking_user:booking_password@localhost:5433/booking_db?sslmode=require";
    expect(upgradeNeonSslMode(local)).toBe(local);
    expect(upgradeNeonSslMode("not a url")).toBe("not a url");
  });
});
