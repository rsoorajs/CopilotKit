// Dedicated runtime for the Agent Config Object demo.
//
// This runtime hosts a single LangGraph agent (`agent_config_agent`) that
// reads three forwarded properties — tone / expertise / responseLength —
// from the run's `RunnableConfig.configurable.properties` and builds its
// system prompt dynamically per turn. The <CopilotKitProvider properties={...}>
// in the demo page is the source of truth for those values.
//
// Scoped to its own endpoint so non-demo cells don't pay the cost of this
// agent's properties plumbing and so the Playwright spec can assert
// request-body propagation against exactly one URL.
//
// References:
// - src/agents/agent_config_agent.py — the graph
// - src/app/demos/agent-config/page.tsx — the provider config

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

// Shape of the AG-UI run input we care about. We avoid a direct import of
// `RunAgentInput` from `@ag-ui/client` so this route has no additional
// peer-dep on internal AG-UI packages — the field we touch (`forwardedProps`)
// is part of the stable AG-UI protocol contract.
type RunInputWithForwardedProps = {
  forwardedProps?: Record<string, unknown> | undefined;
  [k: string]: unknown;
};

const LANGGRAPH_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123";

// Keys on `forwardedProps` that the ag-ui LangGraphAgent treats as reserved
// stream-payload fields. These must NOT be repacked into `context` — they
// are structural fields the LangGraph SDK understands directly. Anything
// else on `forwardedProps` is user-supplied frontend state that needs to
// reach the graph node.
//
// `context` itself is reserved: LangGraph 1.x exposes it as the run-scoped
// context channel, and we want any explicit `forwardedProps.context` from a
// caller to pass through verbatim (and merge with user-supplied props
// rather than be wrapped a level deeper).
//
// Keep this list in sync with ag-ui/langgraph/typescript/src/agent.ts
// `RunAgentExtendedInput["forwardedProps"]`.
const RESERVED_FORWARDED_PROPS_KEYS = new Set<string>([
  "config",
  "command",
  "context",
  "streamMode",
  "streamSubgraphs",
  "nodeName",
  "threadMetadata",
  "checkpointId",
  "checkpointDuring",
  "interruptBefore",
  "interruptAfter",
  "multitaskStrategy",
  "ifNotExists",
  "afterSeconds",
  "onCompletion",
  "onDisconnect",
  "webhook",
  "feedbackKeys",
  "metadata",
]);

/**
 * Wrapper around `LangGraphAgent` that repacks the CopilotKit provider's
 * `properties` (which arrive as top-level keys on `forwardedProps`) into
 * `forwardedProps.context` so the Python LangGraph graph receives them as
 * its run-scoped `Runtime[ContextSchema].context`.
 *
 * Why this bridge exists: LangGraph 1.x rejects requests that send
 * `configurable` with the error "Cannot specify both configurable and
 * context. Prefer setting context alone." Any frontend-derived state has
 * to ride the new `context` channel — `configurable.properties` is no
 * longer accepted.
 *
 * The CopilotKit runtime forwards `CopilotKitCore.properties` as
 * `forwardedProps` (see core's run-handler). The ag-ui LangGraphAgent
 * spreads `forwardedProps` directly onto the LangGraph stream payload, so
 * placing the merged values under `forwardedProps.context` makes them
 * arrive at the graph's `Runtime.context`.
 */
class AgentConfigLangGraphAgent extends LangGraphAgent {
  // Intercept each run() to move provider `properties` (which land as
  // top-level keys on `forwardedProps`) onto `forwardedProps.context` —
  // the LangGraph 1.x channel for run-scoped configuration. AG-UI then
  // spreads `forwardedProps` into the SDK call, so `context` arrives at
  // the graph node's `Runtime[ContextSchema].context`.
  run(
    input: Parameters<LangGraphAgent["run"]>[0],
  ): ReturnType<LangGraphAgent["run"]> {
    const repacked = repackForwardedPropsIntoContext(
      input as RunInputWithForwardedProps,
    );
    return super.run(repacked as Parameters<LangGraphAgent["run"]>[0]);
  }
}

function repackForwardedPropsIntoContext<T extends RunInputWithForwardedProps>(
  input: T,
): T {
  const fp = (input.forwardedProps ?? {}) as Record<string, unknown>;
  if (!fp || typeof fp !== "object") return input;

  // Split forwardedProps into (structural) and (user-supplied) halves.
  const userProps: Record<string, unknown> = {};
  const structural: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fp)) {
    if (RESERVED_FORWARDED_PROPS_KEYS.has(key)) {
      structural[key] = value;
    } else {
      userProps[key] = value;
    }
  }

  if (Object.keys(userProps).length === 0) return input;

  // Merge user-supplied props into any pre-existing `forwardedProps.context`
  // so an explicit context object from a caller is preserved alongside the
  // provider's `properties`.
  const existingContext =
    (structural.context as Record<string, unknown> | undefined) ?? {};
  const mergedContext = {
    ...existingContext,
    ...userProps,
  };

  return {
    ...input,
    forwardedProps: {
      ...structural,
      context: mergedContext,
    },
  } as T;
}

const agentConfigAgent = new AgentConfigLangGraphAgent({
  deploymentUrl: LANGGRAPH_URL,
  graphId: "agent_config_agent",
  langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
});

const agents: Record<string, LangGraphAgent> = {
  // The page's <CopilotKitProvider agent="agent-config-demo"> resolves here.
  "agent-config-demo": agentConfigAgent,
  // Internal components (headless-chat, example-canvas) call `useAgent()` with
  // no args, which defaults to agentId "default". Alias to the same graph so
  // those component hooks resolve instead of throwing "Agent 'default' not
  // found".
  default: agentConfigAgent,
};

const runtime = new CopilotRuntime({
  // @ts-ignore -- Published CopilotRuntime agents type wraps Record in
  // MaybePromise<NonEmptyRecord<...>> which rejects plain Records; fixed in
  // source, pending release.
  agents,
});

export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      endpoint: "/api/copilotkit-agent-config",
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
