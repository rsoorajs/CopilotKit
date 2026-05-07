# MCP Apps

## What This Demo Shows

MCP Apps are MCP servers that expose tools with associated UI resources.
The CopilotKit runtime is wired with `mcpApps: { servers: [...] }`
pointing at the public Excalidraw MCP server. The middleware auto-fetches
the UI resource on each MCP tool call and emits an activity event; the
built-in `MCPAppsActivityRenderer` (registered automatically by
`CopilotKitProvider`) renders the sandboxed iframe inline in the chat.

## How to Interact

Try asking your Copilot to:

- "Use Excalidraw to draw a simple flowchart with three steps."
- "Open Excalidraw and sketch a system diagram with a client, server, and database."

The agent calls the Excalidraw `create_view` MCP tool. CopilotKit renders
the resulting Excalidraw board inline as a sandboxed iframe — no
app-side renderer registration required.

## Technical Details

- **Runtime config (`copilotkit-mcp-apps/route.ts`)**: `mcpApps.servers`
  declares the MCP server (URL + stable `serverId`). The runtime
  auto-applies the MCP Apps middleware to every registered agent.
- **Backend agent (`mcp_apps_agent.py`)**: A plain ADK `LlmAgent` with no
  bespoke tools — the MCP middleware injects the remote MCP server's
  tools into the agent's tool list at request time.
- **Frontend (`page.tsx`)**: A bare `<CopilotChat />` is enough.
  CopilotKitProvider auto-registers `MCPAppsActivityRenderer` for the
  `mcp-apps` activity type, so the iframe appears inline with no
  `useRenderActivityMessage` registration on the page.

Reference: [docs.copilotkit.ai/integrations/langgraph/generative-ui/mcp-apps](https://docs.copilotkit.ai/integrations/langgraph/generative-ui/mcp-apps)
