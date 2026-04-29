# Declarative Generative UI (A2UI Dynamic Schema)

## What This Demo Shows

The agent dynamically composes UI from a registered catalog of branded
React components via the A2UI middleware. The component schema (Zod)
lives on the frontend; the backend's `generate_a2ui` tool calls a
secondary LLM bound to `render_a2ui` and returns an `a2ui_operations`
container that the runtime middleware streams to the frontend renderer.

## How to Interact

Try asking the agent to:

- "Show me a quick KPI dashboard with 3-4 metrics."
- "Show a pie chart of sales by region."
- "Render a bar chart of quarterly revenue."
- "Give me a status report on system health."

## Technical Details

- Frontend catalog: `./a2ui/catalog.ts`, `./a2ui/definitions.ts`,
  `./a2ui/renderers.tsx`. `createCatalog(..., { includeBasicCatalog: true })`
  merges in CopilotKit's basic A2UI primitives.
- Backend agent: `src/agents/a2ui_dynamic.py` — owns the `generate_a2ui`
  tool. The runtime route at `src/app/api/copilotkit-declarative-gen-ui/route.ts`
  sets `a2ui.injectA2UITool: false` so the runtime does not double-inject.
- Provider wiring: `<CopilotKit a2ui={{ catalog: myCatalog }}>` injects
  the catalog schema into the agent's `copilotkit.context`.

## Reference

- https://docs.copilotkit.ai/integrations/langgraph/generative-ui/a2ui
