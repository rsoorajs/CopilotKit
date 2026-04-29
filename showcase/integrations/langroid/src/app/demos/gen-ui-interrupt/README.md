# Gen UI Interrupt (unsupported)

Listed in `manifest.yaml :: not_supported_features` and rendered as a stub.

The reference implementation (see `showcase/integrations/langgraph-python/src/app/demos/gen-ui-interrupt/`) pauses the agent mid-run via LangGraph's native `interrupt()` primitive, surfaces a payload to the frontend's `useInterrupt` hook, and resumes once the user resolves it.

Langroid's `ChatAgent` has no equivalent pause/resume primitive — there is no supported way to suspend an in-flight `llm_response_async` call, send the partial state to the client, and pick up from the same execution context after the user acts. We deliberately ship a stub page rather than a degraded approximation (e.g. a frontend-tool shim), because the entire point of this demo is the native interrupt primitive.
