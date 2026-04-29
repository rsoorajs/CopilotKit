# Headless Interrupt — Not Supported by Spring AI

## What This Demo Would Show

A headless chat surface (built on `useAgent`) handling agent interrupts
out-of-band — the agent pauses via a graph `interrupt(...)`, a custom UI
collects user input, and the run resumes with the resolved value.

## Why Spring AI Cannot Support This

Same root cause as `gen-ui-interrupt`: Spring AI's `ChatClient` has no
graph-interrupt primitive — there is no way for the agent to suspend the run
and emit a typed interrupt event to the frontend that resumes on a client
response. The headless variant exposes the same primitive via `useAgent`'s
interrupt channel, which Spring AI never emits.

## Where This Works

See the LangGraph Python integration:
[`showcase/integrations/langgraph-python/src/app/demos/interrupt-headless`](../../../../../langgraph-python/src/app/demos/interrupt-headless).
