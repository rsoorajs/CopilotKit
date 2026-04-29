# Headless Interrupt — Not Supported

## Why It's Not Supported

This demo drives the same LangGraph `interrupt()` primitive as `gen-ui-interrupt` — just from a plain button grid instead of a chat-rendered card. The Claude Agent SDK has no equivalent graph-level pause/resume primitive, so this flow cannot be ported.

## What To Use Instead

For human-in-the-loop on this backend, see:

- **`hitl`** — in-chat approval gate using a regular tool call.
- **`hitl-in-app`** — out-of-chat approval modal driven by `useFrontendTool`.

## Reference

- [langgraph-python `interrupt-headless`](../../../../../langgraph-python/src/app/demos/interrupt-headless) — the canonical implementation, for context.
