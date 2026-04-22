import { randomUUID } from "node:crypto";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { Command, getCurrentTaskInput } from "@langchain/langgraph";

export const TodoSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  emoji: z.string(),
  status: z.enum(["pending", "completed"]),
});

export type Todo = z.infer<typeof TodoSchema>;

export const manage_todos = tool(
  (
    input: { todos: Todo[] },
    config?: { toolCall?: { id?: string } },
  ) => {
    const todos = input.todos.map((t) => ({
      ...t,
      id: t.id && t.id.length > 0 ? t.id : randomUUID(),
    }));
    return new Command({
      update: {
        todos,
        messages: [
          new ToolMessage({
            content: "Successfully updated todos",
            tool_call_id: config?.toolCall?.id ?? "manage_todos",
          }),
        ],
      },
    });
  },
  {
    name: "manage_todos",
    description: "Manage the current todos.",
    schema: z.object({ todos: z.array(TodoSchema) }),
  },
);

export const get_todos = tool(
  () => {
    const state = getCurrentTaskInput() as { todos?: Todo[] };
    return JSON.stringify(state.todos ?? []);
  },
  {
    name: "get_todos",
    description: "Get the current todos.",
    schema: z.object({}),
  },
);

export const todo_tools = [manage_todos, get_todos];
