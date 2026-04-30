# gen-ui-interrupt (google-adk -- Strategy B)

Interrupt-style scheduling via **Strategy B**: the backend ADK agent defines a
system prompt that instructs it to call `schedule_meeting`, and the frontend
registers that tool via `useFrontendTool` with an async handler. The handler
renders a time-picker card inline in the chat and returns a Promise that only
resolves once the user picks a slot (or cancels) -- producing the same UX as
the LangGraph native interrupt, just with different plumbing.

## Reference implementation

See the canonical LangGraph implementation in
[`langgraph-python`](../../../../langgraph-python/src/app/demos/gen-ui-interrupt/).
