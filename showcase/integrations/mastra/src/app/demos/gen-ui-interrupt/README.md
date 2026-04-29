# gen-ui-interrupt — Not supported by mastra

**Feature:** In-Chat HITL via the low-level `useInterrupt` primitive — an
interactive component rendered inline in the chat that gives the developer
direct control over the agent interrupt lifecycle.

**Why it is not supported on Mastra:** Mastra's workflow `suspend` /
`resume` semantics are not bridged through `getLocalAgent` into the AG-UI
protocol. `useInterrupt` listens for AG-UI `INTERRUPT` custom events, and
the Mastra adapter never emits them, so the hook never fires.

**Working reference:** see the `langgraph-python` integration —
`src/app/demos/gen-ui-interrupt/page.tsx`.
