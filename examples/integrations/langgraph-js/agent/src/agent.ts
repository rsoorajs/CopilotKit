import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import {
  Annotation,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import {
  convertActionsToDynamicStructuredTools,
  CopilotKitStateAnnotation,
} from "@copilotkit/sdk-js/langgraph";

import { todo_tools, type Todo } from "./todos.js";
import { query_data } from "./query.js";
import { search_flights } from "./a2ui_fixed_schema.js";
import { generate_a2ui } from "./a2ui_dynamic_schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PROMPT = readFileSync(
  path.join(__dirname, "..", "PROMPT.md"),
  "utf8",
);

const AgentStateAnnotation = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  todos: Annotation<Todo[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;

const tools = [query_data, ...todo_tools, generate_a2ui, search_flights];

async function chat_node(state: AgentState, config: RunnableConfig) {
  const model = new ChatOpenAI({ model: "gpt-5.4" });

  const modelWithTools = model.bindTools!(
    [
      ...convertActionsToDynamicStructuredTools(state.copilotkit?.actions ?? []),
      ...tools,
    ],
    { parallel_tool_calls: false },
  );

  const systemMessage = new SystemMessage({ content: SYSTEM_PROMPT });

  const response = await modelWithTools.invoke(
    [systemMessage, ...state.messages],
    config,
  );

  return { messages: response };
}

function shouldContinue({ messages, copilotkit }: AgentState) {
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    const actions = copilotkit?.actions;
    const toolCallName = lastMessage.tool_calls[0].name;
    if (!actions || actions.every((action) => action.name !== toolCallName)) {
      return "tool_node";
    }
  }
  return "__end__";
}

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat_node", chat_node)
  .addNode("tool_node", new ToolNode(tools))
  .addEdge(START, "chat_node")
  .addEdge("tool_node", "chat_node")
  .addConditionalEdges("chat_node", shouldContinue as any);

const memory = new MemorySaver();

export const graph = workflow.compile({ checkpointer: memory });
