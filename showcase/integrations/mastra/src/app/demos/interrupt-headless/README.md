# interrupt-headless — Not supported by mastra

**Feature:** Headless interrupt — resolve agent interrupts from a plain
button grid using `useHeadlessInterrupt`, without a chat surface or render
prop.

**Why it is not supported on Mastra:** Mastra's workflow `suspend` /
`resume` semantics are not bridged through `getLocalAgent` into the AG-UI
protocol. `useHeadlessInterrupt` listens for AG-UI `INTERRUPT` custom
events, and the Mastra adapter never emits them, so there is nothing to
resolve.

**Working reference:** see the `langgraph-python` integration —
`src/app/demos/interrupt-headless/page.tsx`.
