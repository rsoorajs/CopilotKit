// Dedicated runtime for the Declarative Generative UI (A2UI — Dynamic Schema)
// cell. Mirrors the working claude-sdk-typescript reference pattern: the
// backend is the neutral default graph (sample_agent), and the runtime
// auto-injects the `render_a2ui` tool (injectA2UITool defaults to true).
// The A2UI middleware serialises the registered client catalog into
// `copilotkit.context` and detects `a2ui_operations` in the tool result,
// streaming rendered surfaces to the frontend.
//
// Reference:
// - showcase/integrations/claude-sdk-typescript/src/app/api/copilotkit-declarative-gen-ui/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

const LANGGRAPH_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123";

const runtime = new CopilotRuntime({
  // @ts-ignore -- see main route.ts
  agents: {
    "declarative-gen-ui": new LangGraphAgent({
      deploymentUrl: LANGGRAPH_URL,
      graphId: "sample_agent",
      langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
    }),
  },
  // `injectA2UITool` defaults to true — the runtime injects the A2UI tool
  // and the default graph receives it via CopilotKit middleware, matching
  // the working claude-sdk-typescript reference pattern.
});

export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      endpoint: "/api/copilotkit-declarative-gen-ui",
      serviceAdapter: new ExperimentalEmptyAdapter(),
      runtime,
    });
    return await handleRequest(req);
  } catch (error: unknown) {
    const e = error as { message?: string; stack?: string };
    return NextResponse.json(
      { error: e.message, stack: e.stack },
      { status: 500 },
    );
  }
};
