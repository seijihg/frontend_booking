import { z } from "zod";

export const messageSchema = z.object({
  role: z.enum(["user", "assistant", "tool", "system"]),
  content: z.string().default(""),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversation_history: z.array(messageSchema).default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
