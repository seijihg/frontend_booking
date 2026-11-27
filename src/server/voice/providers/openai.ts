import "server-only";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

import { getEnv } from "@/server/env";
import type { ChatMessage, ChatProvider } from "../assistant";
import { getOpenAI } from "../openai";
import type { ToolDefinition } from "../tools";

export function createOpenAIProvider(): ChatProvider {
  return {
    async complete(messages: ChatMessage[], tools: ToolDefinition[]) {
      const response = await getOpenAI().chat.completions.create({
        model: getEnv().OPENAI_MODEL,
        messages: messages as ChatCompletionMessageParam[],
        tools: tools as ChatCompletionTool[],
        tool_choice: "auto",
      });
      const message = response.choices[0]?.message;
      const toolCalls = (message?.tool_calls ?? []).flatMap((tc) =>
        tc.type === "function"
          ? [{ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }]
          : []
      );
      return { content: message?.content ?? "", toolCalls };
    },
  };
}
