# Generative UI (Interrupt) — Not Supported

This feature is **not supported** by the Claude Agent SDK (TypeScript) integration. It appears under `not_supported_features` in `manifest.yaml`.

## Why It Is Unsupported

The canonical Generative UI (Interrupt) demo depends on interrupt-driven UI primitives — the agent runtime must be able to pause mid-turn, surface a structured request to the frontend, await a response, and resume the same call. The LangGraph and Pydantic AI runtimes expose this machinery directly.

The Claude Agent SDK pass-through this integration runs on top of does not currently expose those primitives. Synthesizing them would require a custom interrupt protocol layered on top of the SDK, which is out of scope for the showcase port.

## Where to See This Feature

The canonical implementation lives in:

- `showcase/integrations/langgraph-typescript/src/app/demos/gen-ui-interrupt/`
- `showcase/integrations/langgraph-python/src/app/demos/gen-ui-interrupt/`
- `showcase/integrations/pydantic-ai/src/app/demos/gen-ui-interrupt/`

If a future Claude SDK release exposes interrupt-style control flow, this stub should be replaced with a real port and the entry removed from `not_supported_features`.
