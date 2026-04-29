// Dedicated runtime for the Open Generative UI demos (Mastra).
//
// Isolated here because the `openGenerativeUI` runtime flag sets
// `openGenerativeUIEnabled: true` globally on the probe response, which
// would cause the CopilotKit provider's setTools effect to wipe per-demo
// `useFrontendTool`/`useComponent` registrations in the default runtime.
//
// Both `open-gen-ui` and `open-gen-ui-advanced` map to the shared
// weatherAgent — the advanced cell only differs by client-side
// sandbox-function registrations passed to <CopilotKit openGenerativeUI={...}>.

import { NextRequest, NextResponse } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgent } from "@ag-ui/mastra";
import { mastra } from "@/mastra";

const openGenUiAgent = getLocalAgent({
  mastra,
  agentId: "weatherAgent",
  resourceId: "mastra-open-gen-ui",
});

if (!openGenUiAgent) {
  throw new Error(
    "getLocalAgent returned null for weatherAgent — required for /demos/open-gen-ui",
  );
}

const openGenUiAdvancedAgent = getLocalAgent({
  mastra,
  agentId: "weatherAgent",
  resourceId: "mastra-open-gen-ui-advanced",
});

if (!openGenUiAdvancedAgent) {
  throw new Error(
    "getLocalAgent returned null for weatherAgent — required for /demos/open-gen-ui-advanced",
  );
}

const runtime = new CopilotRuntime({
  // @ts-ignore -- see main route.ts; published CopilotRuntime's `agents`
  // type wraps Record in MaybePromise<NonEmptyRecord<...>> which rejects
  // plain Records. Fixed in source, pending release.
  agents: {
    "open-gen-ui": openGenUiAgent,
    "open-gen-ui-advanced": openGenUiAdvancedAgent,
  },
  openGenerativeUI: {
    agents: ["open-gen-ui", "open-gen-ui-advanced"],
  },
});

export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      endpoint: "/api/copilotkit-ogui",
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
