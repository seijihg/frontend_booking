import "server-only";

import { executeToolCall, type VoiceContext, type VoiceRepo } from "./executor";
import { TOOL_DEFINITIONS, type ToolDefinition } from "./tools";

export const MAX_TOOL_CALL_ROUNDS = 5;

export const FALLBACK_REPLY =
  "I'm having trouble processing your request. Please try again with a simpler instruction.";

/** Opaque OpenAI chat-completions message, as stored by the UI. */
export type ChatMessage = {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_call_id?: string;
  tool_calls?: Record<string, unknown>[];
};

export type ToolCall = { id: string; name: string; arguments: string };

export interface ChatProvider {
  complete(
    messages: ChatMessage[],
    tools: ToolDefinition[]
  ): Promise<{ content: string; toolCalls: ToolCall[] }>;
}

export type AssistantResult = {
  reply: string;
  history: ChatMessage[];
  createdAppointmentIds: number[];
};

function parseArguments(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Port of Django `ChatView._tool_call_loop`. */
export async function runAssistant(params: {
  systemPrompt: string;
  history: ChatMessage[];
  message: string;
  ctx: VoiceContext;
  repo: VoiceRepo;
  provider: ChatProvider;
}): Promise<AssistantResult> {
  const { systemPrompt, history, message, ctx, repo, provider } = params;

  const turn: ChatMessage[] = [...history, { role: "user", content: message }];
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...turn];
  const createdAppointmentIds: number[] = [];

  const finish = (reply: string): AssistantResult => ({
    reply,
    // Like Django, intermediate tool messages are not returned to the UI.
    history: [...turn, { role: "assistant", content: reply }],
    createdAppointmentIds,
  });

  for (let round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
    const { content, toolCalls } = await provider.complete(messages, TOOL_DEFINITIONS);
    if (toolCalls.length === 0) return finish(content || "");

    messages.push({
      role: "assistant",
      content: content || "",
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    for (const tc of toolCalls) {
      const args = parseArguments(tc.arguments);
      const result =
        args === undefined
          ? JSON.stringify({ error: "Invalid tool arguments: not valid JSON." })
          : await executeToolCall(tc.name, args, ctx, repo);
      messages.push({ role: "tool", tool_call_id: tc.id, content: result });

      if (tc.name === "create_appointment") {
        const data = parseArguments(result) as
          | { created?: boolean; appointment_id?: number }
          | undefined;
        if (data?.created && typeof data.appointment_id === "number") {
          createdAppointmentIds.push(data.appointment_id);
        }
      }
    }
  }

  return finish(FALLBACK_REPLY);
}
