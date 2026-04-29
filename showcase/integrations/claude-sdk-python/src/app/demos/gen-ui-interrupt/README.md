# Gen UI Interrupt — Not Supported

## Why It's Not Supported

The langgraph `useInterrupt` flow depends on the LangGraph runtime's built-in `interrupt()` primitive — a graph-level pause/resume protocol with thread-scoped checkpointing and `Command(resume=...)` semantics.

The Claude Agent SDK's Anthropic Messages stream has no equivalent. There is no graph, no checkpointer, and no resume primitive — so there's nothing to map `useInterrupt` onto.

## What To Use Instead

For human-in-the-loop on this backend, see:

- **`hitl`** — in-chat approval gate using a regular tool call. The agent proposes steps, the user approves/rejects in chat, and the same tool call resolves with the user's decision.
- **`hitl-in-app`** — out-of-chat approval modal driven by `useFrontendTool` with an async handler.

Both model approval gating without requiring a graph-level interrupt primitive.

## Reference

- [langgraph-python `gen-ui-interrupt`](../../../../../langgraph-python/src/app/demos/gen-ui-interrupt) — the canonical implementation, for context.
