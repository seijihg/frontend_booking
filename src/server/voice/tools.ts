import "server-only";
import { z } from "zod";

export type ToolName =
  | "lookup_customer"
  | "create_customer"
  | "check_availability"
  | "create_appointment";

export type ToolDefinition = {
  type: "function";
  function: {
    name: ToolName;
    description: string;
    parameters: Record<string, unknown>;
  };
};

/** Definition schemas: the single source of the JSON Schema sent to the model. */
const definitions = {
  lookup_customer: {
    description:
      "Look up an existing customer by phone number in the salon's customer list.",
    schema: z.object({
      phone_number: z
        .string()
        .describe("Customer phone number in E.164 format (e.g. '+447700900123')."),
    }),
  },
  create_customer: {
    description:
      "Create a new customer record in the salon. Only call after lookup_customer returns not found.",
    schema: z.object({
      full_name: z.string().describe("Customer's full name."),
      phone_number: z.string().describe("Phone in E.164 format."),
    }),
  },
  check_availability: {
    description:
      "Check if a time slot is available. Returns which columns (1-5) are free.",
    schema: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format."),
      time: z.string().describe("Start time in HH:MM (24-hour) format."),
      duration_minutes: z
        .number()
        .int()
        .default(60)
        .describe("Duration in minutes, multiple of 15. Default 60."),
      column_id: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe("Optional specific column (1-5) to check."),
    }),
  },
  create_appointment: {
    description: "Book an appointment. Always check_availability first.",
    schema: z.object({
      customer_id: z.number().int().describe("Customer's database ID."),
      phone_number: z
        .string()
        .describe(
          "Customer phone number in E.164 format. Must match the customer record as a safety check."
        ),
      appointment_time: z
        .string()
        .describe("ISO 8601 format (e.g. '2024-03-15T14:30:00Z')."),
      duration_minutes: z
        .number()
        .int()
        .default(60)
        .describe("Duration in minutes, multiple of 15. Default 60."),
      column_id: z.number().int().min(1).max(5).describe("Column/staff member (1-5)."),
      comment: z.string().default("").describe("Optional booking notes."),
    }),
  },
} satisfies Record<ToolName, { description: string; schema: z.ZodObject }>;

const SAFE_INT = Number.MAX_SAFE_INTEGER;

/** zod emits safe-integer bounds for `.int()`; the wire format has none. */
function toParameters(schema: z.ZodObject): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  delete json.$schema;
  const props = json.properties as Record<string, Record<string, unknown>>;
  for (const prop of Object.values(props)) {
    if (prop.minimum === -SAFE_INT) delete prop.minimum;
    if (prop.maximum === SAFE_INT) delete prop.maximum;
  }
  json.additionalProperties = false;
  return json;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = (
  Object.entries(definitions) as [ToolName, (typeof definitions)[ToolName]][]
).map(([name, def]) => ({
  type: "function",
  function: { name, description: def.description, parameters: toParameters(def.schema) },
}));

/**
 * Lenient argument schemas. Django read arguments with `args.get(key, default)`,
 * so wrong or missing values fall back to defaults and the executor reports the
 * problem as error JSON rather than throwing.
 */
const str = z.string().catch("");
const num = z.number().optional().catch(undefined);
const duration = z.number().default(60).catch(60);

const argSchemas = {
  lookup_customer: z.object({ phone_number: str }),
  create_customer: z.object({ full_name: str, phone_number: str }),
  check_availability: z.object({
    date: str,
    time: str,
    duration_minutes: duration,
    column_id: num,
  }),
  create_appointment: z.object({
    customer_id: num,
    phone_number: str,
    appointment_time: str,
    duration_minutes: duration,
    column_id: num,
    comment: str,
  }),
};

export type ToolArgs = {
  [K in keyof typeof argSchemas]: z.infer<(typeof argSchemas)[K]>;
};

export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(argSchemas, name);
}

/** Never throws: non-object input is treated as `{}`. */
export function parseToolArgs<N extends ToolName>(name: N, raw: unknown): ToolArgs[N] {
  const input = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {};
  return argSchemas[name].parse(input) as ToolArgs[N];
}
