// Dedicated runtime for the byoc-hashbrown demo (Mastra).
//
// The demo page wraps CopilotChat in the HashBrownDashboard provider and
// overrides the assistant message slot with a renderer that consumes
// hashbrown-shaped structured output via `@hashbrownai/react`'s `useUiKit`
// + `useJsonParser`.
//
// In Mastra, the same shared weatherAgent backs this demo — the dashboard
// shape is enforced entirely on the frontend by the catalog the renderer
// consumes. For full parity (system prompt tuned to emit the dashboard
// envelope), a dedicated Mastra agent could be wired here later.

import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgent } from "@ag-ui/mastra";
import { mastra } from "@/mastra";

const byocHashbrownAgent = getLocalAgent({
  mastra,
  agentId: "weatherAgent",
  resourceId: "mastra-byoc-hashbrown",
});

if (!byocHashbrownAgent) {
  throw new Error(
    "getLocalAgent returned null for weatherAgent — required for /demos/byoc-hashbrown",
  );
}

const runtime = new CopilotRuntime({
  // @ts-ignore -- see main route.ts
  agents: { "byoc-hashbrown-demo": byocHashbrownAgent },
});

export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      endpoint: "/api/copilotkit-byoc-hashbrown",
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
