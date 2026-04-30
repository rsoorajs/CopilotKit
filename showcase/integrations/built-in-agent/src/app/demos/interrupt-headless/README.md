# Headless Interrupt — Not supported

`interrupt-headless` drives the same `useInterrupt` primitive as
`gen-ui-interrupt`, but from arbitrary app surface (not the chat). It
still depends on LangGraph's graph-interrupt lifecycle.

The built-in-agent integration uses TanStack AI's chat-completions
factory, which has no equivalent graph-interrupt primitive — there is
no node-level pause/resume to hook into. See the
`langgraph-python` integration for a working implementation.
