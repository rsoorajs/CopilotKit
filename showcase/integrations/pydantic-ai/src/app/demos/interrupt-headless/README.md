# Interrupt (Headless) — Not Supported

## What this feature does

The reference langgraph-python cell uses LangGraph's `interrupt()`
primitive to pause graph execution mid-run from a fully headless surface
(no `CopilotChat` primitives) — the app handles the interrupt payload
itself via `useAgent` and resumes the graph with a programmatic answer.

## Why pydantic-ai cannot support it

PydanticAI's AG-UI bridge has no graph-interrupt primitive — runs are
linear (`agent.run` / `agent.iter`) and cannot pause execution to await
a frontend response and resume the same in-flight call. Without that
primitive, the headless interrupt resume protocol that this cell
demonstrates has no surface area to bind to.

## Where it works

See the langgraph-python integration for the working reference:
`showcase/integrations/langgraph-python/src/app/demos/interrupt-headless/`.
