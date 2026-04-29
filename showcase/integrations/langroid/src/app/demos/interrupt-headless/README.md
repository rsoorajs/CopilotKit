# Interrupt (Headless) (unsupported)

Listed in `manifest.yaml :: not_supported_features` and rendered as a stub.

Same root cause as `gen-ui-interrupt`: the LangGraph reference implementation drives a fully-headless chat surface around `interrupt()`/`resolve()`. Langroid's `ChatAgent` has no equivalent pause/resume primitive, so neither the headless nor the in-chat variant of this demo can be ported faithfully.
