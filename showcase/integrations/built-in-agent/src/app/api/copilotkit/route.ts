import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { createBuiltInAgent } from "@/lib/factory/tanstack-factory";

const runtime = new CopilotRuntime({
  agents: { default: createBuiltInAgent() },
  runner: new InMemoryAgentRunner(),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const GET = (req: Request) => handler(req);
export const POST = (req: Request) => handler(req);
export const OPTIONS = (req: Request) => handler(req);
