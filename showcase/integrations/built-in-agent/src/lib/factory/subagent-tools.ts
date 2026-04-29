import { z } from "zod";
import { chat, toolDefinition } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

// @region[subagent-setup]
// Each role becomes its own nested chat() with a dedicated system prompt.
// They don't share memory or tools with the supervisor — the supervisor
// only sees the role's return value via the delegate tool below.
const subagentRoles = [
  {
    id: "planner",
    systemPrompt:
      "You are a trip planner. Reply concisely with the day-by-day plan.",
  },
  {
    id: "researcher",
    systemPrompt: "You are a researcher. Reply concisely with verified facts.",
  },
] as const;
// @endregion[subagent-setup]

// Builder takes the parent run's AbortController so subagent `chat()` calls
// abort with the parent. Constructing tools at module-import time leaves them
// with their own fresh AbortController, which means a user cancel never reaches
// the in-flight subagent call — orphan async work, billed tokens, hung
// promises. Each parent run threads its controller through here.
// @region[supervisor-delegation-tools]
// Each `delegate_to_<role>` tool wraps a nested chat() call with the
// role's system prompt. The supervisor LLM "calls" these tools to
// delegate work; each invocation runs the matching subagent and returns
// its output for the supervisor's next step.
export function buildSubagentTools(parentAbortController: AbortController) {
  return subagentRoles.map((role) =>
    toolDefinition({
      name: `delegate_to_${role.id}`,
      description: `Delegate a task to the ${role.id} subagent.`,
      inputSchema: z.object({
        task: z.string().describe(`Task description for the ${role.id}`),
      }),
    }).server(async ({ task }) => {
      const text = await chat({
        adapter: openaiText("gpt-4o"),
        messages: [{ role: "user", content: task }],
        systemPrompts: [role.systemPrompt],
        abortController: parentAbortController,
        stream: false,
      });
      return { role: role.id, text };
    }),
  );
}
// @endregion[supervisor-delegation-tools]
