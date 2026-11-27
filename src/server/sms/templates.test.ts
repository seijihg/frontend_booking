import { describe, expect, it } from "vitest";

import { cancellationText, confirmationText, reminderText } from "./templates";

const args = {
  customerName: "Ada",
  salonName: "Default Salon",
  appointmentTime: "2026-12-01T14:30:00Z",
};

describe("sms templates", () => {
  it("confirmation", () => {
    expect(confirmationText(args)).toBe(
      "Hi Ada, Your appointment at Default Salon has been confirmed for 2026-12-01 at 2:30 PM. See you soon!"
    );
  });
  it("falls back to Customer for a blank name", () => {
    expect(confirmationText({ ...args, customerName: "" })).toContain("Hi Customer, ");
    expect(reminderText({ ...args, customerName: "" })).toContain("Hi Customer, ");
  });
  it("cancellation", () => {
    expect(cancellationText(args)).toBe(
      "Hi, We regret to inform you that your scheduled appointment for 2026-12-01 2:30 PM has been cancelled."
    );
  });
  it("reminder", () => {
    expect(reminderText(args)).toBe(
      "Hi Ada, You have an appointment coming up at 2:30 PM. Regards Default Salon."
    );
  });
  it("uses UTC wall-clock around midnight and 12-hour edges", () => {
    expect(cancellationText({ appointmentTime: "2026-12-31T00:05:00Z" })).toContain("2026-12-31 12:05 AM");
    expect(cancellationText({ appointmentTime: "2026-12-31T12:00:00Z" })).toContain("2026-12-31 12:00 PM");
  });
});
