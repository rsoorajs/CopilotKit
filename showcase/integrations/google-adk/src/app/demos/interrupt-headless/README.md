# interrupt-headless (google-adk — not supported)

Headless interrupt: a backend `interrupt()` pauses execution and the
frontend renders the resume UI in an external app surface (outside chat)
via `useHeadlessInterrupt` subscribing to the agent's `on_interrupt`
custom-event stream.

## Why google-adk can't support this

`useHeadlessInterrupt` (like `useInterrupt`) requires backend
`on_interrupt` custom events to fire. `ag-ui-adk` does not expose an
`interrupt()` primitive on Google ADK `LlmAgent`s and does not emit those
events, so there is no signal for the headless surface to subscribe to.

## Reference implementation

See the canonical implementation in
[`langgraph-python`](../../../../langgraph-python/src/app/demos/interrupt-headless/).
