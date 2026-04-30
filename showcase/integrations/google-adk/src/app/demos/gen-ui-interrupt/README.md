# gen-ui-interrupt (google-adk — not supported)

Interrupt-based Generative UI: a backend tool pauses execution via
LangGraph's `interrupt()` primitive, surfaces a payload to the frontend's
`useInterrupt` hook, and resumes once the user responds in chat.

## Why google-adk can't support this

The `useInterrupt` hook depends on the backend emitting `on_interrupt`
custom events. `ag-ui-adk` (the AG-UI middleware that exposes ADK
`LlmAgent`s) has no `interrupt()` primitive and does not emit those
events, so the frontend hook never fires and there is no pause/resume
boundary to render against.

## Reference implementation

See the canonical implementation in
[`langgraph-python`](../../../../langgraph-python/src/app/demos/gen-ui-interrupt/).
