# interrupt-headless (google-adk -- Strategy B)

Headless interrupt via **Strategy B**: the backend ADK agent defines a system
prompt that instructs it to call `schedule_meeting`, and the frontend registers
that tool via `useFrontendTool` with an async handler. The handler shows a
time-picker popup in the app surface (outside the chat) and returns a Promise
that only resolves once the user picks a slot (or cancels) -- producing the
same headless UX as the LangGraph reference, just with different plumbing.

## Reference implementation

See the canonical LangGraph implementation in
[`langgraph-python`](../../../../langgraph-python/src/app/demos/interrupt-headless/).
