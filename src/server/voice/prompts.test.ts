import { describe, expect, it } from "vitest";

import { buildSystemPrompt, currentUtcDateTime, SYSTEM_PROMPT } from "./prompts";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt({
    currentDateTime: "2026-03-01 14:00",
    salonName: "Test Salon",
    salonId: 7,
    userName: "Test Staff",
  });

  it("injects the context block", () => {
    expect(prompt).toContain("Current date/time: 2026-03-01 14:00");
    expect(prompt).toContain("Salon: Test Salon (ID: 7)");
    expect(prompt).toContain("Staff user: Test Staff");
  });

  it("leaves no placeholders behind", () => {
    expect(prompt).not.toMatch(/\{(current_datetime|salon_name|salon_id|user_name)\}/);
  });

  it("keeps the static rules", () => {
    expect(SYSTEM_PROMPT).toContain("## Booking Workflow");
    expect(prompt).toContain("ALWAYS ask for phone number first");
  });

  it("does not re-expand placeholders inside injected values", () => {
    const p = buildSystemPrompt({
      currentDateTime: "x",
      salonName: "{user_name}",
      salonId: 1,
      userName: "U",
    });
    expect(p).toContain("Salon: {user_name} (ID: 1)");
  });
});

describe("currentUtcDateTime", () => {
  it("formats as YYYY-MM-DD HH:mm", () => {
    expect(currentUtcDateTime()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});
