import { describe, expect, it } from "vitest";

import { parseToolArgs, TOOL_DEFINITIONS } from "./tools";

const fn = (name: string, description: string, parameters: object) => ({
  type: "function",
  function: { name, description, parameters },
});

/** Verbatim copy of the Django `TOOL_DEFINITIONS` (booking_api/voice/tools.py). */
const DJANGO_TOOL_DEFINITIONS = [
  fn(
    "lookup_customer",
    "Look up an existing customer by phone number in the salon's customer list.",
    {
      type: "object",
      properties: {
        phone_number: {
          type: "string",
          description: "Customer phone number in E.164 format (e.g. '+447700900123').",
        },
      },
      required: ["phone_number"],
      additionalProperties: false,
    }
  ),
  fn(
    "create_customer",
    "Create a new customer record in the salon. Only call after lookup_customer returns not found.",
    {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Customer's full name." },
        phone_number: { type: "string", description: "Phone in E.164 format." },
      },
      required: ["full_name", "phone_number"],
      additionalProperties: false,
    }
  ),
  fn(
    "check_availability",
    "Check if a time slot is available. Returns which columns (1-5) are free.",
    {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format." },
        time: { type: "string", description: "Start time in HH:MM (24-hour) format." },
        duration_minutes: {
          type: "integer",
          description: "Duration in minutes, multiple of 15. Default 60.",
          default: 60,
        },
        column_id: {
          type: "integer",
          description: "Optional specific column (1-5) to check.",
          minimum: 1,
          maximum: 5,
        },
      },
      required: ["date", "time"],
      additionalProperties: false,
    }
  ),
  fn("create_appointment", "Book an appointment. Always check_availability first.", {
    type: "object",
    properties: {
      customer_id: { type: "integer", description: "Customer's database ID." },
      phone_number: {
        type: "string",
        description:
          "Customer phone number in E.164 format. Must match the customer record as a safety check.",
      },
      appointment_time: {
        type: "string",
        description: "ISO 8601 format (e.g. '2024-03-15T14:30:00Z').",
      },
      duration_minutes: {
        type: "integer",
        description: "Duration in minutes, multiple of 15. Default 60.",
        default: 60,
      },
      column_id: {
        type: "integer",
        description: "Column/staff member (1-5).",
        minimum: 1,
        maximum: 5,
      },
      comment: { type: "string", description: "Optional booking notes.", default: "" },
    },
    required: ["customer_id", "phone_number", "appointment_time", "column_id"],
    additionalProperties: false,
  }),
];

describe("TOOL_DEFINITIONS", () => {
  it("deep-equals the Django definitions", () => {
    expect(TOOL_DEFINITIONS).toEqual(DJANGO_TOOL_DEFINITIONS);
  });

  it("keeps the Django property order", () => {
    const names = TOOL_DEFINITIONS.map((t) => Object.keys(t.function.parameters.properties as object));
    expect(names).toEqual(
      DJANGO_TOOL_DEFINITIONS.map((t) =>
        Object.keys((t.function.parameters as { properties: object }).properties)
      )
    );
  });

  it("has no $schema key", () => {
    for (const t of TOOL_DEFINITIONS) expect(t.function.parameters).not.toHaveProperty("$schema");
  });
});

describe("parseToolArgs", () => {
  it("defaults duration to 60 and comment to empty", () => {
    expect(
      parseToolArgs("create_appointment", { customer_id: 1, column_id: 2 })
    ).toMatchObject({ duration_minutes: 60, comment: "", phone_number: "", appointment_time: "" });
    expect(parseToolArgs("check_availability", { date: "d", time: "t" }).duration_minutes).toBe(60);
  });

  it("falls back instead of throwing on wrong types", () => {
    const out = parseToolArgs("check_availability", {
      date: 5,
      time: null,
      duration_minutes: "x",
      column_id: "y",
    });
    expect(out).toEqual({ date: "", time: "", duration_minutes: 60, column_id: undefined });
  });

  it("treats non-object input as empty", () => {
    expect(parseToolArgs("lookup_customer", null)).toEqual({ phone_number: "" });
    expect(parseToolArgs("lookup_customer", [1])).toEqual({ phone_number: "" });
  });

  it("keeps valid values", () => {
    expect(parseToolArgs("create_customer", { full_name: "A", phone_number: "+44" })).toEqual({
      full_name: "A",
      phone_number: "+44",
    });
  });
});
