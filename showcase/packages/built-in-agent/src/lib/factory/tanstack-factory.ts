import {
  BuiltInAgent,
  convertInputToTanStackAI,
} from "@copilotkit/runtime/v2";
import { chat } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { stateTools } from "./state-tools";
import { baseServerTools } from "./server-tools";
import { subagentTools } from "./subagent-tools";

const allServerTools = [
  ...stateTools,
  ...baseServerTools,
  ...subagentTools,
];

export function createBuiltInAgent() {
  return new BuiltInAgent({
    type: "tanstack",
    factory: ({ input, abortController }) => {
      const { messages, systemPrompts } = convertInputToTanStackAI(input);
      return chat({
        adapter: openaiText("gpt-4o"),
        messages,
        systemPrompts,
        tools: allServerTools,
        abortController,
      });
    },
  });
}
