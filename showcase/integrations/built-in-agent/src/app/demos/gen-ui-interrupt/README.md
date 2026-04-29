# Gen UI Interrupt — Not supported

`gen-ui-interrupt` renders a custom UI mid-run via the lower-level
`useInterrupt` primitive, which is bound to LangGraph's graph-interrupt
lifecycle (an `interrupt()` node pauses the graph; the UI resumes it).

The built-in-agent integration uses TanStack AI's chat-completions
factory, which has no equivalent graph-interrupt primitive — there is
no node-level pause/resume to hook into. See the
`langgraph-python` integration for a working implementation.

For HITL flows that don't need a graph-interrupt, see the supported
`hitl-in-chat-booking` and `hitl-in-app` demos.
