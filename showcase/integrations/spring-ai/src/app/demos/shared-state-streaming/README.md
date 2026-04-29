# Shared State Streaming — Not Supported by Spring AI

## What This Demo Would Show

The agent emits **mid-stream state deltas** (partial state snapshots) while
its run is still in progress, so the UI updates live as the agent thinks —
typically via LangGraph's `copilotkit_emit_state` helper streamed through
the AG-UI `STATE_DELTA` event.

## Why Spring AI Cannot Support This

The ag-ui Spring AI adapter has **no mid-stream state-delta API analogous
to `copilotkit_emit_state`**. Spring AI's `ChatClient` streams tokens and
tool calls, but it does not expose a hook for the agent to push partial
state snapshots between tokens. The Spring AI integration emits a single
`STATE_SNAPSHOT` per tool round (see `shared-state-read-write` for that
pattern), not a continuous delta stream.

## Where This Works

See the LangGraph Python integration:
[`showcase/integrations/langgraph-python/src/app/demos/shared-state-streaming`](../../../../../langgraph-python/src/app/demos/shared-state-streaming).
