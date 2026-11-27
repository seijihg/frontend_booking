import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDto } from "@/server/services/users";
import {
  MAX_TOOL_CALL_ROUNDS,
  runAssistant,
  type ChatMessage,
  type ChatProvider,
  type ToolCall,
} from "./assistant";
import type { VoiceRepo } from "./executor";
import { TOOL_DEFINITIONS, type ToolDefinition } from "./tools";

type Reply = { content: string; toolCalls: ToolCall[] };

const text = (content: string): Reply => ({ content, toolCalls: [] });
const call = (id: string, name: string, args: object): Reply => ({
  content: "",
  toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
});

function fakeProvider(replies: Reply[]) {
  let i = 0;
  const seen: ChatMessage[][] = [];
  const complete = vi.fn(async (messages: ChatMessage[], _tools: ToolDefinition[]) => {
    seen.push(messages.map((m) => ({ ...m })));
    return replies[Math.min(i++, replies.length - 1)];
  });
  const provider: ChatProvider = { complete };
  return { provider, complete, seen };
}

const customer = { id: 1, fullName: "Ellie Smith", phoneNumber: "+447700900123" };
const repo: VoiceRepo = {
  findCustomerByPhone: vi.fn(async () => customer),
  findCustomerById: vi.fn(async () => customer),
  createCustomer: vi.fn(async () => customer),
  listAppointmentsOnDay: vi.fn(async () => []),
  createAppointment: vi.fn(async () => ({ id: 42 })),
};
const ctx = { salonId: 1, user: { id: 1, salons: [1] } as UserDto };

const run = (provider: ChatProvider, message = "hello", history: ChatMessage[] = []) =>
  runAssistant({ systemPrompt: "SYSTEM", history, message, ctx, repo, provider });

beforeEach(() => vi.clearAllMocks());

describe("runAssistant", () => {
  it("returns a plain text reply with history of 2 and no system message", async () => {
    const { provider, seen } = fakeProvider([text("How can I help?")]);
    const out = await run(provider, "Hello");
    expect(out.reply).toBe("How can I help?");
    expect(out.history).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "How can I help?" },
    ]);
    expect(out.history.some((m) => m.role === "system")).toBe(false);
    expect(out.createdAppointmentIds).toEqual([]);
    expect(seen[0][0]).toEqual({ role: "system", content: "SYSTEM" });
    expect(seen[0].at(-1)).toEqual({ role: "user", content: "Hello" });
  });

  it("passes the tool definitions to the provider", async () => {
    const { provider, complete } = fakeProvider([text("Hi")]);
    await run(provider);
    expect(complete.mock.calls[0][1]).toBe(TOOL_DEFINITIONS);
  });

  it("executes a single tool call then replies", async () => {
    const { provider, complete, seen } = fakeProvider([
      call("call_123", "lookup_customer", { phone_number: "+447700900123" }),
      text("Found Ellie Smith."),
    ]);
    const out = await run(provider, "Look up 07700900123");
    expect(out.reply).toBe("Found Ellie Smith.");
    expect(repo.findCustomerByPhone).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(2);
    const second = seen[1];
    expect(second.at(-2)).toEqual({
      role: "assistant",
      content: "",
      tool_calls: [
        {
          id: "call_123",
          type: "function",
          function: { name: "lookup_customer", arguments: '{"phone_number":"+447700900123"}' },
        },
      ],
    });
    expect(second.at(-1)?.role).toBe("tool");
    expect(second.at(-1)?.tool_call_id).toBe("call_123");
    expect(JSON.parse(second.at(-1)!.content)).toMatchObject({ found: true, customer_id: 1 });
    // Intermediate tool messages are not returned to the UI.
    expect(out.history).toHaveLength(2);
  });

  it("runs several rounds of tool calls", async () => {
    const { provider } = fakeProvider([
      call("c1", "lookup_customer", { phone_number: "+447700900123" }),
      call("c2", "check_availability", { date: "2026-03-01", time: "14:00" }),
      text("Columns 1, 2, 3, 4, 5 are available."),
    ]);
    const out = await run(provider, "Book Ellie at 2pm");
    expect(out.reply).toBe("Columns 1, 2, 3, 4, 5 are available.");
    expect(repo.findCustomerByPhone).toHaveBeenCalledTimes(1);
    expect(repo.listAppointmentsOnDay).toHaveBeenCalledTimes(5);
  });

  it("executes two tool calls from one round", async () => {
    const { provider, seen } = fakeProvider([
      {
        content: "",
        toolCalls: [
          { id: "a", name: "lookup_customer", arguments: '{"phone_number":"+447700900123"}' },
          { id: "b", name: "lookup_customer", arguments: '{"phone_number":"+447700900123"}' },
        ],
      },
      text("Done."),
    ]);
    await run(provider);
    expect(repo.findCustomerByPhone).toHaveBeenCalledTimes(2);
    const tail = seen[1].slice(-3);
    expect(tail.map((m) => m.role)).toEqual(["assistant", "tool", "tool"]);
    expect(tail.slice(1).map((m) => m.tool_call_id)).toEqual(["a", "b"]);
  });

  it("preserves the supplied history in order", async () => {
    const history: ChatMessage[] = [
      { role: "user", content: "Book at 2pm" },
      { role: "assistant", content: "Which column?" },
    ];
    const { provider, seen } = fakeProvider([text("Column 3 it is.")]);
    const out = await run(provider, "Column 3 please", history);
    expect(seen[0]).toHaveLength(4);
    expect(seen[0][1].content).toBe("Book at 2pm");
    expect(seen[0][2].content).toBe("Which column?");
    expect(out.history.map((m) => m.content)).toEqual([
      "Book at 2pm",
      "Which column?",
      "Column 3 please",
      "Column 3 it is.",
    ]);
    expect(history).toHaveLength(2);
  });

  it("stops after the maximum number of rounds", async () => {
    const { provider, complete } = fakeProvider([
      call("loop", "lookup_customer", { phone_number: "+447700900123" }),
    ]);
    const out = await run(provider, "test");
    expect(complete).toHaveBeenCalledTimes(MAX_TOOL_CALL_ROUNDS);
    expect(MAX_TOOL_CALL_ROUNDS).toBe(5);
    expect(out.reply.toLowerCase()).toContain("try again");
    expect(out.history.at(-1)).toEqual({ role: "assistant", content: out.reply });
  });

  it("collects ids of created appointments", async () => {
    const { provider } = fakeProvider([
      call("c1", "create_appointment", {
        customer_id: 1,
        phone_number: "+447700900123",
        appointment_time: "2099-03-15T14:30:00Z",
        column_id: 2,
      }),
      text("Booked."),
    ]);
    const out = await run(provider);
    expect(out.createdAppointmentIds).toEqual([42]);
  });

  it("does not collect ids when creation fails", async () => {
    const { provider } = fakeProvider([
      call("c1", "create_appointment", {
        customer_id: 1,
        phone_number: "+447700900123",
        appointment_time: "2001-01-01T00:00:00Z",
        column_id: 2,
      }),
      text("Sorry."),
    ]);
    const out = await run(provider);
    expect(out.createdAppointmentIds).toEqual([]);
  });

  it("reports invalid tool argument JSON to the model instead of throwing", async () => {
    const { provider, seen } = fakeProvider([
      { content: "", toolCalls: [{ id: "x", name: "lookup_customer", arguments: "{oops" }] },
      text("Retrying."),
    ]);
    const out = await run(provider);
    expect(out.reply).toBe("Retrying.");
    expect(JSON.parse(seen[1].at(-1)!.content)).toHaveProperty("error");
  });

  it("propagates provider errors", async () => {
    const provider: ChatProvider = {
      complete: async () => {
        throw new Error("API error");
      },
    };
    await expect(run(provider)).rejects.toThrow("API error");
  });
});
