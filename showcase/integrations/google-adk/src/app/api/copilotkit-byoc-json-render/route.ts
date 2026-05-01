// Dedicated runtime for the byoc-json-render demo. Mirrors langgraph-python's
// /api/copilotkit-byoc-json-render route.

import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

const byocJsonRenderAgent = new HttpAgent({
  url: `${AGENT_URL}/byoc_json_render`,
});

const runtime = new CopilotRuntime({
  // @ts-expect-error -- see main route.ts
  // Kebab-case + `-demo` suffix matches the sibling
  // `byoc-hashbrown-demo` / `a2ui-fixed-schema` / `auth-demo` routes.
  agents: { "byoc-json-render-demo": byocJsonRenderAgent },
});

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  endpoint: "/api/copilotkit-byoc-json-render",
  serviceAdapter: new ExperimentalEmptyAdapter(),
  runtime,
});

export const POST = async (req: NextRequest) => {
  try {
    return await handleRequest(req);
  } catch (error: unknown) {
    const e = error as { message?: string; stack?: string };
    return NextResponse.json(
      { error: e.message, stack: e.stack },
      { status: 500 },
    );
  }
};
