# interrupt-headless — Not supported in LlamaIndex

This feature is **architecturally unsupported** by the LlamaIndex integration.

## Why

`interrupt-headless` depends on the same graph-interrupt primitive as
`gen-ui-interrupt`: a runtime mechanism that pauses agent execution and
resumes it with a user-supplied value. LlamaIndex's `FunctionAgent` runtime
does not expose such a pause/resume hook in its agent loop, so the headless
interrupt flow cannot be modeled on this runtime.

## What to use instead

For headless HITL in LlamaIndex, combine `/demos/headless-simple` (or
`/demos/headless-complete`) with the frontend-tool pattern shown in
`/demos/hitl-in-chat`. The agent calls a frontend-defined tool, your custom
chat surface renders the prompt, and the user's response flows back as the
tool result — no backend interrupt required.

## Dashboard status

This feature is declared under `not_supported_features` in
`showcase/integrations/llamaindex/manifest.yaml` and renders as an
**unsupported** cell (distinct from "unshipped") in the showcase dashboard.
