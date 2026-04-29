# MCP Apps

## What This Demo Shows

MCP Apps are MCP servers that expose tools with associated UI resources.
The CopilotKit runtime is wired with `mcpApps: { servers: [...] }` (see
`src/app/api/copilotkit-mcp-apps/route.ts`) which auto-applies the MCP
Apps middleware: when the agent calls an MCP tool, the middleware
fetches the associated UI resource and emits an activity event; the
built-in `MCPAppsActivityRenderer` registered by `CopilotKitProvider`
renders the sandboxed iframe inline.

This cell points at the public Excalidraw MCP server
(`https://mcp.excalidraw.com`).

## How to Interact

- "Use Excalidraw to draw a simple flowchart with three steps."
- "Open Excalidraw and sketch a system diagram with a client, server, and database."

## Technical Details

- Backend agent: `src/agents/mcp_apps_agent.py` — a no-tools
  ConversableAgent. MCP server tools are injected by the runtime
  middleware at request time.
- Runtime route: `src/app/api/copilotkit-mcp-apps/route.ts` —
  `mcpApps.servers` lists the Excalidraw MCP server with a pinned
  `serverId` so persisted threads survive URL changes.
- Frontend: a plain `<CopilotChat />` — no app-side activity-renderer
  registration; the built-in `MCPAppsActivityRenderer` handles render.

## Reference

- https://docs.copilotkit.ai/integrations/langgraph/generative-ui/mcp-apps
