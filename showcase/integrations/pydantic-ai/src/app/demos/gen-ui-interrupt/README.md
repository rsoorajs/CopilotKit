# Gen UI (Interrupt) — Not Supported

## What this feature does

The reference langgraph-python cell uses LangGraph's `interrupt()`
primitive to pause graph execution mid-tool-call, surface an interactive
component in the chat, await the user's resume value, then continue the
graph with that value substituted in. It is the canonical way to embed
generative UI that the agent then *acts on*.

## Why pydantic-ai cannot support it

PydanticAI's AG-UI bridge has no equivalent of LangGraph's
`interrupt()` primitive — runs are linear (`agent.run` / `agent.iter`)
and cannot pause execution to await a frontend response and resume the
same in-flight call with that value. Approval-style HITL can be modeled
with frontend tools, but graph-style interrupts cannot.

## Where it works

See the langgraph-python integration for the working reference:
`showcase/integrations/langgraph-python/src/app/demos/gen-ui-interrupt/`.
