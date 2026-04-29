# gen-ui-interrupt — Not supported in LlamaIndex

This feature is **architecturally unsupported** by the LlamaIndex integration.

## Why

`gen-ui-interrupt` depends on a graph-interrupt primitive: the agent runtime
must be able to pause mid-step, surface a typed payload to the frontend, and
resume execution once the user responds. This is the same `interrupt()` /
`Command(resume=...)` pair that LangGraph exposes.

LlamaIndex's `FunctionAgent` runtime does not expose an equivalent pause/resume
hook in its agent loop. Implementing this feature here would require
reinventing a graph-interrupt mechanism on top of LlamaIndex, which is out of
scope for this integration.

## What to use instead

For the same in-chat HITL UX, see `/demos/hitl-in-chat`. That demo uses the
`useHumanInTheLoop` frontend-tool pattern: the agent calls a frontend-defined
tool, the UI renders inline, and the user's response flows back as the tool
result. No backend interrupt required.

## Dashboard status

This feature is declared under `not_supported_features` in
`showcase/integrations/llamaindex/manifest.yaml` and renders as an
**unsupported** cell (distinct from "unshipped") in the showcase dashboard.
