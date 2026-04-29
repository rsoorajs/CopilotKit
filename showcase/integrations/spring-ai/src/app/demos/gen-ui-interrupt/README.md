# Generative UI (Interrupt) — Not Supported by Spring AI

## What This Demo Would Show

An agent pauses mid-run via a graph-level `interrupt(...)` primitive and the
frontend renders a generative UI card whose result resumes the run. The
frontend uses `useInterrupt({ render: ({ event, resolve }) => ... })`.

## Why Spring AI Cannot Support This

Spring AI's `ChatClient` exposes a single forward request/response (with
streaming tokens / tool calls), but it has no first-class **graph-interrupt
primitive** — there is no `interrupt(...)` callable that the agent can use
to suspend the run, hand a payload to the frontend, and resume on a typed
client response. HITL on Spring AI is implemented via tool-call round trips
(see `hitl-in-chat`, `hitl-in-app`, `hitl`) which are a different shape.

## Where This Works

See the LangGraph Python integration:
[`showcase/integrations/langgraph-python/src/app/demos/gen-ui-interrupt`](../../../../../langgraph-python/src/app/demos/gen-ui-interrupt).
