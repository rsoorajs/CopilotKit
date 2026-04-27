import { z } from "zod";
import { chat, toolDefinition } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

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

function buildDelegationTool(role: (typeof subagentRoles)[number]) {
  return toolDefinition({
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
      abortController: new AbortController(),
      stream: false,
    });
    return { role: role.id, text };
  });
}

export const subagentTools = subagentRoles.map(buildDelegationTool);
